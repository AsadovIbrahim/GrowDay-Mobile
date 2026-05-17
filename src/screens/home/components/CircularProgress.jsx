import React, { useEffect, useState, useRef } from "react";
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
    const [animatedValue, setAnimatedValue] = useState(boundedPercent);
    const prevPercentRef = useRef(boundedPercent);

    useEffect(() => {
        let startTime = null;
        let animationFrame;
        const duration = 800; // Bir az daha sürətli animasiya (0.8s)
        const startValue = prevPercentRef.current;
        const diff = boundedPercent - startValue;

        const animate = (time) => {
            if (!startTime) startTime = time;
            const progress = Math.min(1, (time - startTime) / duration);

            // Ease out cubic effekti
            const easeOut = 1 - Math.pow(1 - progress, 3);
            const nextValue = startValue + (diff * easeOut);
            
            setAnimatedValue(nextValue);

            if (progress < 1) {
                animationFrame = requestAnimationFrame(animate);
            } else {
                prevPercentRef.current = boundedPercent;
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
                className="font-redditsans-bold"
                style={{
                    fontSize: 22,
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
