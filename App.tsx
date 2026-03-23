import "./global.css"
import React from "react";
import { SafeAreaProvider,SafeAreaView } from "react-native-safe-area-context";
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Navigation from "./src/stacks/Navigation";
const App=()=> {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <SafeAreaView style={{flex:1}}>
          <Navigation></Navigation>
        </SafeAreaView>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
export default App;