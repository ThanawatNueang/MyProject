
export const registerUser = async (data) => {
    console.log(data);
    const res = await fetch('http://100.100.45.89:3201/api/auth/register',{
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });

    const resData = await res.json();
   
  return {
    status: res.status,
    ok: res.ok,
    data: resData,
  }
}

export const loginUser = async (data) => {
    console.log(data);

    const res = await fetch('http://100.100.45.89:3201/api/auth/login',{
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            email: data.name, 
            password: data.password, 
        }),
    });

    const jData = await res.json();
    console.log(jData);
    

    if(jData.token){
        localStorage.setItem('userToken', jData.token);

        const displayName = jData?.user?.name || "";
        localStorage.setItem('user', JSON.stringify({name: displayName}));

        const raw = jData?.user?.profileImageURL || jData?.user?.profileImage || "";
        const full = raw ? (raw.startsWith('http') ? raw : `http://100.100.45.89:3201${raw}`) : "";
        if (full) localStorage.setItem('profileImageURL', full);

        window.dispatchEvent(new Event('auth:login'));
    }

    return {
        status: res.status,
        ok: res.ok,
        data: jData,
    };
}

export const logoutUser = async () => {
    const token = localStorage.getItem("userToken");
    const res = await fetch('http://100.100.45.89:3201/api/auth/logout',{
        method: "POST",
        headers: { 
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
         },
    }) 
    return res.json();
}