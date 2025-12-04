const VITE_API_URL = "http://10.0.2.2:5207";

//Authentication API
export const loginfetch = async (formData) => {
    const response = await fetch(`${VITE_API_URL}/api/auth/login`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
    });
    const data=await response.json();
    console.log(data);
    return data;
}

export const registerfetch = async (formData) => {
    const response = await fetch(`${VITE_API_URL}/api/auth/register`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
    });
    const data=await response.json();
    console.log(data);
    return data;
}

