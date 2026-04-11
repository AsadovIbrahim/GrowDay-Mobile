const VITE_API_URL = "http://10.0.2.2:5207";
// const VITE_API_URL = "http://192.168.31.138:5207";


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
    const response = await fetch(`${VITE_API_URL}/api/Habit/GetAllHabits?pageIndex=${pageIndex}&pageSize=${pageSize}&_t=${Date.now()}`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
        },
        cache: "no-store",
    });

    const data=await response.json();
    return data;

}

export const getUserHabitFetch = async (token,pageIndex=0,pageSize=3) => {
    const response = await fetch(`${VITE_API_URL}/api/UserHabit/GetMyHabits?pageIndex=${pageIndex}&pageSize=${pageSize}&_t=${Date.now()}`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
        },
        cache: "no-store",
    });
    const data=await response.json();
    return data;
}

export const getTodaysUserHabitFetch = async (token, date = null,pageIndex=0,pageSize=10) => {
    let url = `${VITE_API_URL}/api/UserHabit/GetTodayHabits?pageIndex=${pageIndex}&pageSize=${pageSize}&_t=${Date.now()}`;
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
        cache: "no-store",
    });
    const data=await response.json();
    return data;
}

export const getUnreadNotificationCountFetch = async (token) => {
    const response = await fetch(`${VITE_API_URL}/api/Notification/unreadcount?_t=${Date.now()}`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
        },
        cache: "no-store",
    });
    const data=await response.json();
    return data;
}

export const getUserHabitCountFetch = async (token) => {
    const response = await fetch(`${VITE_API_URL}/api/UserHabit/getuserhabitcount?_t=${Date.now()}`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
        },
        cache: "no-store",
    });
    const data=await response.json();
    return data;
}
export const getUserHabitByFrequencyFetch = async (token, frequency) => {
    const baseUrl = `${VITE_API_URL}/api/UserHabit/GetUserHabitByFrequency`;
    const url = frequency && frequency !== "All"
        ? `${baseUrl}?frequency=${frequency}&_t=${Date.now()}`
        : `${baseUrl}?_t=${Date.now()}`;
  
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      cache: "no-store",
    });
  
    return await response.json();
  };
  

export const getUserNotificationsFetch = async (token,pageIndex=0,pageSize=10) => {
    const response = await fetch(`${VITE_API_URL}/api/Notification/getnotification?pageIndex=${pageIndex}&pageSize=${pageSize}&_t=${Date.now()}`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
        },
        cache: "no-store",
    });
    const data=await response.json();
    return data;
}

export const getUserUnreadNotificationsFetch = async (token) => {
    const response = await fetch(`${VITE_API_URL}/api/Notification/unreadnotifications?_t=${Date.now()}`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
        },
        cache: "no-store",
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
    const response = await fetch(`${VITE_API_URL}/api/UserPreferences/GetUserPreferences?_t=${Date.now()}`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
        },
        cache: "no-store",
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
        cache: "no-store",
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
        ? `${VITE_API_URL}/api/Statistic/daily?date=${date}&_t=${Date.now()}`
        : `${VITE_API_URL}/api/Statistic/daily?_t=${Date.now()}`;
    const response = await fetch(url, {
        method: "GET",
        headers: {
            "Authorization": `Bearer ${token}`,
        },
        cache: "no-store",
    });
    const data = await response.json();
    return data;
};

export const getUserSuggestedHabitsFetch = async (token,pageIndex=0,pageSize=10) => {
    const response = await fetch(`${VITE_API_URL}/api/SuggestedHabit/GetUserSuggestedHabits?pageIndex=${pageIndex}&pageSize=${pageSize}&_t=${Date.now()}`, {
        method: "GET",
        headers: {
            "Authorization": `Bearer ${token}`,
        },
        cache: "no-store",
    });
    const data = await response.json();
    return data;
};

export const getUserTasksFetch = async (token) => {
    const response = await fetch(`${VITE_API_URL}/api/UserTask/GetMyTasks?_t=${Date.now()}`, {
        method: "GET",
        headers: {
            "Authorization": `Bearer ${token}`,
        },
        cache: "no-store",
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

export const addCustomUserHabitFetch=async(token,payload)=>{
    const response=await fetch(`${VITE_API_URL}/api/UserHabit/CreateMyOwnHabit`,{
        method:"POST",
        headers:{
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
    });
    const data=await response.json();
    return data;
}
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
    const response = await fetch(`${VITE_API_URL}/api/Achievement/GetAllAchievements?pageIndex=${pageIndex}&pageSize=${pageSize}&_t=${Date.now()}`, {
        method: "GET",
        headers: {
            "Authorization": `Bearer ${token}`,
        },
        cache: "no-store",
    });
    const data = await response.json();
    return data;
};

export const getUserAchievementsFetch = async (token,pageIndex=0,pageSize=10) => {
    const response = await fetch(`${VITE_API_URL}/api/Achievement/GetUserAchievements?pageIndex=${pageIndex}&pageSize=${pageSize}&_t=${Date.now()}`, {
        method: "GET",
        headers: {
            "Authorization": `Bearer ${token}`,
        },
        cache: "no-store",
    });
    const data = await response.json();
    return data;
};

export const getUserTotalPoints=async(token)=>{
    const response=await fetch(`${VITE_API_URL}/api/UserActivity/GetTotalPoints?_t=${Date.now()}`,{
        method:"GET",
        headers:{
            "Authorization":`Bearer ${token}`,
        },
        cache: "no-store",
    });
    const data=await response.json();
    return data;
}

export const getUserHabitByIdFetch = async (token, userHabitId, date = null) => {
    const url = date 
        ? `${VITE_API_URL}/api/UserHabit/${userHabitId}?date=${date}&_t=${Date.now()}`
        : `${VITE_API_URL}/api/UserHabit/${userHabitId}?_t=${Date.now()}`;
    const response = await fetch(url, {
        method: "GET",
        headers: {
            "Authorization": `Bearer ${token}`,
        },
        cache: "no-store",
    });
    const data = await response.json();
    return data;
};

export const completeUserHabitFetch = async (token, userHabitId, note = null, date = null) => {
    let url = `${VITE_API_URL}/api/UserHabit/Complete/${userHabitId}`;
    if (date) {
        url += `?date=${date}`;
    }
    const response = await fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
        },
        body: note ? JSON.stringify(note) : null,
    });
    const data = await response.json();
    return data;
};

export const incrementUserHabitFetch = async (token, userHabitId, note = null, date = null) => {
    let url = `${VITE_API_URL}/api/UserHabit/Increment/${userHabitId}`;
    if (date) {
        url += `?date=${date}`;
    }
    const response = await fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
        },
        body: note ? JSON.stringify(note) : null,
    });
    const data = await response.json();
    return data;
};

export const reportHabitProgressFetch = async (token, payload) => {
    const response = await fetch(`${VITE_API_URL}/api/UserHabit/report-progress`, {
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

export const getWeeklyProgressFetch = async (token, userHabitId) => {
    const response = await fetch(`${VITE_API_URL}/api/UserHabit/GetWeeklyProgress/${userHabitId}?_t=${Date.now()}`, {
        method: "GET",
        headers: {
            "Authorization": `Bearer ${token}`,
        },
        cache: "no-store",
    });
    const data = await response.json();
    return data;
};

export const verifyOtpFetch=async (email,otpCode)=>{
    const response=await fetch(`${VITE_API_URL}/api/auth/verify-otp`,{
        method:"POST",
        headers:{
            "Content-Type":"application/json",
        },
        body:JSON.stringify({email,otpCode}),
    });
    const data=await response.json();
    return data;
}

