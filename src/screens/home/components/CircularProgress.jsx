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
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (percent / 100) * circumference;
    const center = size / 2;

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
                }}
            >
                {percent}%
            </Text>
        </View>
    );
};

export default CircularProgress;
