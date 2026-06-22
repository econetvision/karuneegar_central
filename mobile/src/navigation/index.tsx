import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, View } from 'react-native';

import { useAuth } from '../contexts/AuthContext';
import { colors } from '../theme';

// Auth screens
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import ForgotPasswordScreen from '../screens/ForgotPasswordScreen';

// Main screens
import HomeScreen from '../screens/HomeScreen';
import MembersScreen from '../screens/MembersScreen';
import ProfileScreen from '../screens/ProfileScreen';
import EditProfileScreen from '../screens/EditProfileScreen';
import ForumsScreen from '../screens/ForumsScreen';
import ForumCategoryScreen from '../screens/ForumCategoryScreen';
import ForumThreadScreen from '../screens/ForumThreadScreen';
import ScholarshipScreen from '../screens/ScholarshipScreen';
import MatrimonyScreen from '../screens/MatrimonyScreen';
import MatrimonyCreateScreen from '../screens/MatrimonyCreateScreen';
import MatrimonyViewScreen from '../screens/MatrimonyViewScreen';
import BusinessesScreen from '../screens/BusinessesScreen';
import BusinessProfileViewScreen from '../screens/BusinessProfileViewScreen';
import CreateBusinessScreen from '../screens/CreateBusinessScreen';
import CreateBusinessAdScreen from '../screens/CreateBusinessAdScreen';
import FamilyTreeScreen from '../screens/FamilyTreeScreen';
import ServicesScreen from '../screens/ServicesScreen';
import AboutScreen from '../screens/AboutScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function HomeStack() {
  return (
    <Stack.Navigator screenOptions={{ headerStyle: { backgroundColor: colors.card }, headerTintColor: colors.text, headerTitleStyle: { fontWeight: '700' } }}>
      <Stack.Screen name="HomeMain" component={HomeScreen} options={{ title: 'Karuneegar Central' }} />
      <Stack.Screen name="About" component={AboutScreen} options={{ title: 'About Us' }} />
    </Stack.Navigator>
  );
}

function MembersStack() {
  return (
    <Stack.Navigator screenOptions={{ headerStyle: { backgroundColor: colors.card }, headerTintColor: colors.text, headerTitleStyle: { fontWeight: '700' } }}>
      <Stack.Screen name="MembersList" component={MembersScreen} options={{ title: 'Members' }} />
      <Stack.Screen name="Profile" component={ProfileScreen} options={{ title: 'Profile' }} />
    </Stack.Navigator>
  );
}

function ForumsStack() {
  return (
    <Stack.Navigator screenOptions={{ headerStyle: { backgroundColor: colors.card }, headerTintColor: colors.text, headerTitleStyle: { fontWeight: '700' } }}>
      <Stack.Screen name="ForumsList" component={ForumsScreen} options={{ title: 'Forums' }} />
      <Stack.Screen name="ForumCategory" component={ForumCategoryScreen} options={{ title: 'Category' }} />
      <Stack.Screen name="ForumThread" component={ForumThreadScreen} options={{ title: 'Thread' }} />
    </Stack.Navigator>
  );
}

function ServicesStack() {
  return (
    <Stack.Navigator screenOptions={{ headerStyle: { backgroundColor: colors.card }, headerTintColor: colors.text, headerTitleStyle: { fontWeight: '700' } }}>
      <Stack.Screen name="ServicesHub" component={ServicesScreen} options={{ title: 'Services' }} />
      <Stack.Screen name="Scholarships" component={ScholarshipScreen} options={{ title: 'Scholarships' }} />
      <Stack.Screen name="Matrimony" component={MatrimonyScreen} options={{ title: 'Matrimony' }} />
      <Stack.Screen name="MatrimonyCreate" component={MatrimonyCreateScreen} options={{ title: 'Create Profile' }} />
      <Stack.Screen name="MatrimonyView" component={MatrimonyViewScreen} options={{ title: 'Profile' }} />
      <Stack.Screen name="Businesses" component={BusinessesScreen} options={{ title: 'Businesses' }} />
      <Stack.Screen name="BusinessProfile" component={BusinessProfileViewScreen} options={{ title: 'Business' }} />
      <Stack.Screen name="CreateBusiness" component={CreateBusinessScreen} options={{ title: 'Create Business' }} />
      <Stack.Screen name="CreateBusinessAd" component={CreateBusinessAdScreen} options={{ title: 'Create Advertisement' }} />
      <Stack.Screen name="FamilyTree" component={FamilyTreeScreen} options={{ title: 'Family Tree' }} />
      <Stack.Screen name="Forums" component={ForumsScreen} options={{ title: 'Forums' }} />
      <Stack.Screen name="Members" component={MembersScreen} options={{ title: 'Members' }} />
    </Stack.Navigator>
  );
}

function ProfileStack() {
  return (
    <Stack.Navigator screenOptions={{ headerStyle: { backgroundColor: colors.card }, headerTintColor: colors.text, headerTitleStyle: { fontWeight: '700' } }}>
      <Stack.Screen name="ProfileMain" component={ProfileScreen} options={{ title: 'My Profile' }} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} options={{ title: 'Edit Profile' }} />
      <Stack.Screen name="FamilyTree" component={FamilyTreeScreen} options={{ title: 'Family Tree' }} />
    </Stack.Navigator>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textLight,
        tabBarStyle: { borderTopColor: colors.border, backgroundColor: colors.card },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        tabBarIcon: ({ focused, color, size }) => {
          const icons: Record<string, [string, string]> = {
            Home: ['home', 'home-outline'],
            Members: ['people', 'people-outline'],
            Forums: ['chatbubbles', 'chatbubbles-outline'],
            Services: ['grid', 'grid-outline'],
            Profile: ['person', 'person-outline'],
          };
          const [active, inactive] = icons[route.name] || ['ellipse', 'ellipse-outline'];
          return <Ionicons name={(focused ? active : inactive) as any} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeStack} />
      <Tab.Screen name="Members" component={MembersStack} />
      <Tab.Screen name="Forums" component={ForumsStack} />
      <Tab.Screen name="Services" component={ServicesStack} />
      <Tab.Screen name="Profile" component={ProfileStack} />
    </Tab.Navigator>
  );
}

function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerStyle: { backgroundColor: colors.card }, headerTintColor: colors.text, headerTitleStyle: { fontWeight: '700' } }}>
      <Stack.Screen name="Login" component={LoginScreen} options={{ title: 'Sign In', headerShown: false }} />
      <Stack.Screen name="Register" component={RegisterScreen} options={{ title: 'Create Account', headerShown: false }} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} options={{ title: 'Reset Password', headerShown: false }} />
    </Stack.Navigator>
  );
}

export default function Navigation() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {user ? <MainTabs /> : <AuthStack />}
    </NavigationContainer>
  );
}
