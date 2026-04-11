import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Create from "../screens/create/Create";
import CreateCustomHabit from "../screens/create/CreateCustomHabit";

const Stack = createNativeStackNavigator();

const CreateStack = () => {
    return(
        <Stack.Navigator screenOptions={{headerShown:false}}>
            <Stack.Screen name="Create" component={Create} />
            <Stack.Screen name="CreateCustomHabit" component={CreateCustomHabit} />
        </Stack.Navigator>
    )
}
export default CreateStack;

