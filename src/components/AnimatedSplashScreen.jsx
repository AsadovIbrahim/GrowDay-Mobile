import React, { useEffect, useState, useRef } from 'react';
import { StyleSheet, View, Text, Animated, Dimensions, Easing } from 'react-native';
import BootSplash from 'react-native-bootsplash';

const { width, height } = Dimensions.get('window');

const AnimatedSplashScreen = ({ onAnimationEnd }) => {
  const [isReady, setIsReady] = useState(false);

  const text = "GrowDay";

  // Animation values
  const containerOpacity = useRef(new Animated.Value(1)).current;
  const logoScale = useRef(new Animated.Value(1)).current;
  
  // Create an Animated.Value for each letter
  const letterAnimations = useRef(text.split('').map(() => new Animated.Value(0))).current;

  const { container, logo } = BootSplash.useHideAnimation({
    manifest: require('../../assets/bootsplash/manifest.json'),
    logo: require('../../assets/bootsplash/logo.png'),
    statusBarTranslucent: true,
    navigationBarTranslucent: false,
    animate: () => {
      setIsReady(true);
      
      // Sequence:
      // 1. Gentle logo heartbeat/scale
      Animated.sequence([
        Animated.timing(logoScale, {
          toValue: 1.05,
          duration: 600,
          easing: Easing.out(Easing.exp),
          useNativeDriver: true,
        }),
        Animated.timing(logoScale, {
          toValue: 1,
          duration: 600,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        })
      ]).start();

      // 2. Letters reveal sequentially (Typewriter / Netflix style)
      const letterAnims = letterAnimations.map((anim, index) => {
        return Animated.timing(anim, {
          toValue: 1,
          duration: 400,
          delay: 400 + (index * 80), // Stagger each letter by 80ms
          useNativeDriver: true,
        });
      });
      Animated.parallel(letterAnims).start();

      // 3. Fade out the whole container and call onAnimationEnd
      Animated.timing(containerOpacity, {
        toValue: 0,
        duration: 500,
        delay: 2200,
        useNativeDriver: true,
      }).start(() => {
        onAnimationEnd();
      });
    },
  });

  return (
    <Animated.View {...container} style={[container.style, { opacity: containerOpacity }]}>
      <View style={styles.content}>
        <Animated.Image 
          {...logo}
          style={[logo.style, { transform: [{ scale: logoScale }] }]} 
        />
        {isReady && (
          <View style={styles.textContainer}>
            {text.split('').map((letter, index) => {
              const anim = letterAnimations[index];
              const translateY = anim.interpolate({
                inputRange: [0, 1],
                outputRange: [20, 0] // Slide up slightly
              });
              
              return (
                <Animated.Text 
                  key={index}
                  style={[
                    styles.text, 
                    { 
                      opacity: anim, 
                      transform: [{ translateY }] 
                    }
                  ]}
                >
                  {letter}
                </Animated.Text>
              );
            })}
          </View>
        )}
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  content: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    flexDirection: 'row',
    position: 'absolute',
    top: 100, // Adjust this to place it below the logo
  },
  text: {
    color: '#FFFFFF',
    fontSize: 36, // Slightly larger since custom fonts might render differently
    letterSpacing: 2,
    fontFamily: 'RedditSans-Bold',
  },
});

export default AnimatedSplashScreen;
