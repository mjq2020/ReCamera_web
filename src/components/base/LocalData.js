import React from "react";

export default function GetCookieToken() {
    const getCookieToken = () => {
        const cookies = document.cookie.split('; ');
        const tokenCookie = cookies.find(row => row.startsWith('token='));
        return tokenCookie ? tokenCookie.split('=')[1] : null;
    };

    const cookieToken = getCookieToken();
    console.log("Cookie中的token:", cookieToken);

    // 优先使用cookie中的token，如果没有则使用localStorage
    const token = cookieToken || window.localStorage.getItem('token');
    console.log("使用的token:", token);
    return token;
}