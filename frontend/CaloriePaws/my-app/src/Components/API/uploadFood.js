export const uploadFood = async (file) => {
  try {
    const token = localStorage.getItem("userToken");
    if (!file) throw new Error("No file provided");

    const fd = new FormData();
    fd.append("Image", file);

    const res = await fetch(`http://100.100.45.89:3201/api/foods/name`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: fd,
    });

    if (!res.ok) {
      throw new Error(`Upload failed: ${res.status} ${res.statusText}`);
    }

    const data = await res.json();
    return data;
  } catch (err) {
    console.error("Upload error:", err);
    throw err;
  }
};
