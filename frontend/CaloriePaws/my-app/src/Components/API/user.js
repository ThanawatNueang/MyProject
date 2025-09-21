
export const userPreview = async () => {
  const token = localStorage.getItem("userToken");

  const res = await fetch('http://100.100.45.89:3201/api/getme', {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,  // ✅ เพิ่มตรงนี้

    },
  });
  
  const response = await res.json();
  console.log(response);
  return response;
}

export const userPreviewRaw = async () => {
  const response = await userPreview();
  return response.user;
}

export const userUpdateMe = async (data) => {
  const token = localStorage.getItem("userToken");
  const isForm = data instanceof FormData;

  const res = await fetch("http://100.100.45.89:3201/api/updateme", {
    method: "PATCH",
    headers: isForm
      ? { Authorization: `Bearer ${token}` } // ❗️อย่าใส่ Content-Type เองถ้าเป็น FormData
      : { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: isForm ? data : JSON.stringify(data),
  });

  const text = await res.text();
  let json;
  try { json = text ? JSON.parse(text) : {}; } catch { json = { raw: text }; }

  if (!res.ok) {
    const msg = json?.message || json?.error || text || `HTTP ${res.status}`;
    throw new Error(msg);
  }
  return json;
};
