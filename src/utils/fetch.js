import { API_URL } from '@env';

const VITE_API_URL = API_URL;

const handleResponse = async (response) => {
    const data = await response.json();
    return data;
};

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

export const googleLoginFetch = async (idToken) => {
    const response = await fetch(`${VITE_API_URL}/api/auth/google-login`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ idToken }),
    });
    const text = await response.text();
    console.log("RAW GOOGLE LOGIN RESPONSE:", text);
    try {
        const data = JSON.parse(text);
        return data;
    } catch (e) {
        throw new Error(`JSON Parse Error. Raw response was: ${text.substring(0, 50)}...`);
    }
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
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
        return await response.json();
    }
    return { success: response.ok, status: response.status };
};

export const markAsAllReadNotificationFetch = async (token) => {
    const response = await fetch(`${VITE_API_URL}/api/Notification/readall`, {
        method: "PUT",
        headers: {
            "Authorization": `Bearer ${token}`,
        },
    });
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
        return await response.json();
    }
    return { success: response.ok, status: response.status };
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
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
        return await response.json();
    }
    return null;
};

export const readNotificationFetch = async (token,notificationId) => {
    const response = await fetch(`${VITE_API_URL}/api/Notification/read/${notificationId}`, {
        method: "PUT",
        headers: {
            "Authorization": `Bearer ${token}`,
        },
    });
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
        return await response.json();
    }
    return { success: response.ok, status: response.status };
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

// ─── ACHIEVEMENT ────────────────────────────────────────────────────────────
export const getUserAchievementsFetch = async (token) => {
    const response = await fetch(`${VITE_API_URL}/api/Achievement?_t=${Date.now()}`, {
        method: "GET",
        headers: {
            "Authorization": `Bearer ${token}`,
        },
        cache: "no-store",
    });
    const data = await response.json();
    return data;
};

export const getNewAchievementsFetch = async (token) => {
    const response = await fetch(`${VITE_API_URL}/api/Achievement/new?_t=${Date.now()}`, {
        method: "GET",
        headers: {
            "Authorization": `Bearer ${token}`,
        },
        cache: "no-store",
    });
    const data = await response.json();
    return data;
};

export const getAchievementStatsFetch = async (token) => {
    const response = await fetch(`${VITE_API_URL}/api/Achievement/stats?_t=${Date.now()}`, {
        method: "GET",
        headers: {
            "Authorization": `Bearer ${token}`,
        },
        cache: "no-store",
    });
    const data = await response.json();
    return data;
};

export const markAchievementsAsSeenFetch = async (token) => {
    const response = await fetch(`${VITE_API_URL}/api/Achievement/mark-seen`, {
        method: "PATCH",
        headers: {
            "Authorization": `Bearer ${token}`,
        },
    });
    const data = await response.json();
    return data;
};

export const getUserTotalXPFetch=async(token)=>{
    const response=await fetch(`${VITE_API_URL}/api/User/GetUserTotalXPCount`,{
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
    return handleResponse(response);
};

export const getUserTasksFetch = async (token, pageIndex = 0, pageSize = 10) => {
    const response = await fetch(`${VITE_API_URL}/api/UserTask?pageIndex=${pageIndex}&pageSize=${pageSize}&_t=${Date.now()}`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
        },
        cache: "no-store",
    });
    return handleResponse(response);
};

export const getUserTaskByIdFetch = async (token, id) => {
    const response = await fetch(`${VITE_API_URL}/api/UserTask/${id}?_t=${Date.now()}`, {
        method: "GET",
        headers: {
            "Authorization": `Bearer ${token}`,
        },
        cache: "no-store",
    });
    return handleResponse(response);
};

export const getUserTaskStatsFetch = async (token) => {
    const response = await fetch(`${VITE_API_URL}/api/UserTask/stats?_t=${Date.now()}`, {
        method: "GET",
        headers: {
            "Authorization": `Bearer ${token}`,
        },
        cache: "no-store",
    });
    return handleResponse(response);
};

export const getUserTasksByStatusFetch = async (token, status) => {
    const response = await fetch(`${VITE_API_URL}/api/UserTask/status/${status}?_t=${Date.now()}`, {
        method: "GET",
        headers: {
            "Authorization": `Bearer ${token}`,
        },
        cache: "no-store",
    });
    return handleResponse(response);
};

export const completeUserTaskFetch = async (token, id) => {
    const response = await fetch(`${VITE_API_URL}/api/UserTask/${id}/complete`, {
        method: "PATCH",
        headers: {
            "Authorization": `Bearer ${token}`,
        },
    });
    return handleResponse(response);
};

export const updateUserTaskFetch = async (token, id, payload) => {
    const response = await fetch(`${VITE_API_URL}/api/UserTask/${id}`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
    });
    return handleResponse(response);
};

export const deleteUserTaskFetch = async (token, id) => {
    const response = await fetch(`${VITE_API_URL}/api/UserTask/${id}`, {
        method: "DELETE",
        headers: {
            "Authorization": `Bearer ${token}`,
        },
    });
    return handleResponse(response);
};

export const getAccountDataFetch = async (token) => {
    const response = await fetch(`${VITE_API_URL}/api/Account/GetAccountData`, {
        method: "GET",
        headers: {
            "Authorization": `Bearer ${token}`,
        },
    });
    const data=await response.json();
    return data;
};