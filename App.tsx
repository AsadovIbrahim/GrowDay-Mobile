import "./global.css"
import React from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Navigation from "./src/stacks/Navigation";
const App=()=> {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <Navigation></Navigation>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
export default App;