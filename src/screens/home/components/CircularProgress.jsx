import React, { useEffect, useState } from "react";
import { View, Text } from "react-native";
import Svg, { Circle } from "react-native-svg";

const CircularProgress = ({
    percent,
    size = 120,
    strokeWidth = 11,
    color = "#2f6f3f",
    trackColor = "#e5e7eb",
    textColor = "#111827",
}) => {
    // Faiz rəqəmini 100-də məhdudlaşdırırıq (məsələn 101% olanda UI-da 100% göstərsin)
    const boundedPercent = Math.min(100, Math.max(0, percent));
    const [animatedValue, setAnimatedValue] = useState(0);

    // Animasiya (requestAnimationFrame ilə daha stabil)
    useEffect(() => {
        let startTime = null;
        let animationFrame;
        const duration = 1200; // ms

        const animate = (time) => {
            if (!startTime) startTime = time;
            const progress = Math.min(1, (time - startTime) / duration);

            // Ease out cubic effekti (yavaşca dayanır)
            const easeOut = 1 - Math.pow(1 - progress, 3);
            setAnimatedValue(easeOut * boundedPercent);

            if (progress < 1) {
                animationFrame = requestAnimationFrame(animate);
            }
        };

        animationFrame = requestAnimationFrame(animate);

        return () => {
            if (animationFrame) cancelAnimationFrame(animationFrame);
        };
    }, [boundedPercent]);

    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const center = size / 2;
    const strokeDashoffset = circumference - (animatedValue / 100) * circumference;

    return (
        <View
            style={{
                width: size,
                height: size,
                alignItems: "center",
                justifyContent: "center",
            }}
        >
            <Svg
                width={size}
                height={size}
                style={{ position: "absolute", transform: [{ rotate: "-90deg" }] }}
            >
                <Circle
                    cx={center}
                    cy={center}
                    r={radius}
                    stroke={trackColor}
                    strokeWidth={strokeWidth}
                    fill="none"
                />
                <Circle
                    cx={center}
                    cy={center}
                    r={radius}
                    stroke={color}
                    strokeWidth={strokeWidth}
                    fill="none"
                    strokeDasharray={`${circumference} ${circumference}`}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                />
            </Svg>

            <Text
                style={{
                    fontSize: 22,
                    fontWeight: "800",
                    color: textColor,
                    textAlign: "center",
                }}
            >
                {Math.round(animatedValue)}%
            </Text>
        </View>
    );
};

export default CircularProgress;
