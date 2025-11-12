import React, { useState, useEffect } from "react";
import "./Base.css"
import DeviceInfoAPI from "../../contexts/API"

const BaseInfo = () => {
    const [baseData, setBaseData] = useState(null);

    const fetchBaseInfo = async () => {
        try {
            setError(null);

            const response = await fetch()


        } catch (err) {



        }


    }



};

export default BaseInfo;