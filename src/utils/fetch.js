const VITE_API_URL = "http://10.0.2.2:5207";

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

export const getTodaysUserHabitFetch = async (token, date = null,pageIndex=0,pageSize=10) => {
    let url = `${VITE_API_URL}/api/UserHabit/GetTodayHabits?pageIndex=${pageIndex}&pageSize=${pageSize}`;
    if (date) {
        const dateStr = date instanceof Date 
            ? date.toISOString().split('T')[0]
            : date;
        url += `&date=${dateStr}`;
    }
    const response = await fetch(url, {
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
export const getUserHabitByFrequencyFetch = async (token, frequency) => {
    const url =
      frequency && frequency !== "All"
        ? `${VITE_API_URL}/api/UserHabit/GetUserHabitByFrequency?frequency=${frequency}`
        : `${VITE_API_URL}/api/UserHabit/GetUserHabitByFrequency`;
  
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
    });
  
    return await response.json();
  };
  

export const getUserNotificationsFetch = async (token,pageIndex=0,pageSize=10) => {
    const response = await fetch(`${VITE_API_URL}/api/Notification/getnotification?pageIndex=${pageIndex}&pageSize=${pageSize}`, {
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

export const getDailyStatisticsFetch = async (token, date = null) => {
    const url = date 
        ? `${VITE_API_URL}/api/Statistic/daily?date=${date}`
        : `${VITE_API_URL}/api/Statistic/daily`;
    const response = await fetch(url, {
        method: "GET",
        headers: {
            "Authorization": `Bearer ${token}`,
        },
    });
    const data = await response.json();
    return data;
};

export const getUserSuggestedHabitsFetch = async (token,pageIndex=0,pageSize=10) => {
    const response = await fetch(`${VITE_API_URL}/api/SuggestedHabit/GetUserSuggestedHabits?pageIndex=${pageIndex}&pageSize=${pageSize}`, {
        method: "GET",
        headers: {
            "Authorization": `Bearer ${token}`,
        },
    });
    const data = await response.json();
    return data;
};

export const getUserTasksFetch = async (token) => {
    const response = await fetch(`${VITE_API_URL}/api/UserTask/GetMyTasks`, {
        method: "GET",
        headers: {
            "Authorization": `Bearer ${token}`,
        },
    });
    const data = await response.json();
    return data;
};

export const addUserHabitFetch = async (token,payload) => {
    const response = await fetch(`${VITE_API_URL}/api/UserHabit/CreateSharedHabit`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
        },  
        body: JSON.stringify(payload),
    });
    const data = await response.json();
    return data;
};

export const deleteUserHabitFetch = async (token,userHabitId) => {
    const response = await fetch(`${VITE_API_URL}/api/UserHabit/${userHabitId}`, {
        method: "DELETE",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
        },
    });
    
    
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
        const data = await response.json();
        return { ...data, status: response.status, ok: response.ok };
    }
    
    return { status: response.status, ok: response.ok, success: response.ok };
};

export const getAllAchievementsFetch = async (token,pageIndex=0,pageSize=10) => {
    const response = await fetch(`${VITE_API_URL}/api/Achievement/GetAllAchievements?pageIndex=${pageIndex}&pageSize=${pageSize}`, {
        method: "GET",
        headers: {
            "Authorization": `Bearer ${token}`,
        },
    });
    const data = await response.json();
    return data;
};

export const getUserAchievementsFetch = async (token,pageIndex=0,pageSize=10) => {
    const response = await fetch(`${VITE_API_URL}/api/Achievement/GetUserAchievements?pageIndex=${pageIndex}&pageSize=${pageSize}`, {
        method: "GET",
        headers: {
            "Authorization": `Bearer ${token}`,
        },
    });
    const data = await response.json();
    return data;
};

export const getUserTotalPoints=async(token)=>{
    const response=await fetch(`${VITE_API_URL}/api/UserActivity/GetTotalPoints`,{
        method:"GET",
        headers:{
            "Authorization":`Bearer ${token}`,
        },
    });
    const data=await response.json();
    return data;
}

export const getUserHabitByIdFetch = async (token, userHabitId) => {
    const response = await fetch(`${VITE_API_URL}/api/UserHabit/${userHabitId}`, {
        method: "GET",
        headers: {
            "Authorization": `Bearer ${token}`,
        },
    });
    const data = await response.json();
    return data;
};