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
    return data;
}

export const forgotPasswordfetch = async (formData) => {
    const response = await fetch(`${VITE_API_URL}/api/auth/forgot-password`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
    });
    const data=await response.json();
    return data;
}

export const createUserPreferencesFetch = async (token,payload) => {
    const response = await fetch(`${VITE_API_URL}/api/UserPreferences/CreateUserPreferences`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
    });
    const data=await response.json();
    return data;
}

export const getAllHabitsFetch = async (token,pageIndex=0,pageSize=3) => {
    const response = await fetch(`${VITE_API_URL}/api/Habit/GetAllHabits?pageIndex=${pageIndex}&pageSize=${pageSize}`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
        },
    });

    const data=await response.json();
    return data;

}

export const getUserHabitFetch = async (token,pageIndex=0,pageSize=3) => {
    const response = await fetch(`${VITE_API_URL}/api/UserHabit/GetMyHabits?pageIndex=${pageIndex}&pageSize=${pageSize}`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
        },
    });
    const data=await response.json();
    return data;
}


export const getUnreadNotificationCountFetch = async (token) => {
    const response = await fetch(`${VITE_API_URL}/api/Notification/unreadcount`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
        },
    });
    const data=await response.json();
    return data;
}

export const getUserHabitCountFetch = async (token) => {
    const response = await fetch(`${VITE_API_URL}/api/UserHabit/getuserhabitcount`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
        },
    });
    const data=await response.json();
    return data;
}

export const getUserNotificationsFetch = async (token) => {
    const response = await fetch(`${VITE_API_URL}/api/Notification/getnotification`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
        },
    });
    const data=await response.json();
    return data;
}

export const getUserUnreadNotificationsFetch = async (token) => {
    const response = await fetch(`${VITE_API_URL}/api/Notification/unreadnotifications`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
        },
    });
    const data=await response.json();
    return data;
}

export const deleteNotificationFetch = async (token,notificationId) => {
    const response = await fetch(`${VITE_API_URL}/api/Notification/${notificationId}`, {
        method: "DELETE",
        headers: {
            "Authorization": `Bearer ${token}`,
        },
    });
    const data = await response.json();
    return data;
};

export const markAsAllReadNotificationFetch = async (token) => {
    const response = await fetch(`${VITE_API_URL}/api/Notification/readall`, {
        method: "PUT",
        headers: {
            "Authorization": `Bearer ${token}`,
        },
    });
    const data = await response.json();
    return data;
};

export const getUserPreferencesFetch = async (token) => {
    const response = await fetch(`${VITE_API_URL}/api/UserPreferences/GetUserPreferences`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
        },
    });
    const data = await response.json();
    return data;
};

export const getNotificationDetailFetch = async (token,notificationId) => {
    const response = await fetch(`${VITE_API_URL}/api/Notification/${notificationId}`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
        },
    });
    const data = await response.json();
    return data;
};

export const readNotificationFetch = async (token,notificationId) => {
    const response = await fetch(`${VITE_API_URL}/api/Notification/read/${notificationId}`, {
        method: "PUT",
        headers: {
            "Authorization": `Bearer ${token}`,
        },
    });
    const data = await response.json();
    return data;
};

export const getDailyStatisticsFetch = async (token) => {
    const response = await fetch(`${VITE_API_URL}/api/Statistic/daily`, {
        method: "GET",
        headers: {
            "Authorization": `Bearer ${token}`,
        },
    });
    const data = await response.json();
    return data;
};