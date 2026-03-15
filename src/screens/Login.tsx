import React, { useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  SafeAreaView, Alert, ActivityIndicator,
} from 'react-native'
import { supabase } from '../lib/supabase'

export default function LoginScreen({ navigation }: any) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async () => {
    if (!email || !password) { Alert.alert('Error', 'Please fill in both fields'); return }
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (error) Alert.alert('Login failed', error.message)
    // Auth state change in AppNavigator handles redirect
  }

  return (
    <SafeAreaView style={s.container}>
      <View style={s.inner}>
        <Text style={s.title}>DeepSleep 🌙</Text>
        <Text style={s.subtitle}>Log in to continue</Text>

        <TextInput style={s.input} placeholder="Email" placeholderTextColor="#8b949e"
          autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail} />
        <TextInput style={s.input} placeholder="Password" placeholderTextColor="#8b949e"
          secureTextEntry value={password} onChangeText={setPassword} />

        <TouchableOpacity style={s.btn} onPress={handleLogin} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.btnTxt}>Log in</Text>}
        </TouchableOpacity>

        <TouchableOpacity style={s.link} onPress={() => navigation.navigate('Signup')}>
          <Text style={s.linkTxt}>Don't have an account? Sign up</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  inner: { flex: 1, padding: 24, justifyContent: 'center' },
  title: { fontSize: 32, fontWeight: '700', color: '#fff', textAlign: 'center', marginBottom: 8 },
  subtitle: { fontSize: 16, color: '#8b949e', textAlign: 'center', marginBottom: 32 },
  input: { backgroundColor: '#161b22', borderWidth: 1, borderColor: '#30363d', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, color: '#fff', fontSize: 16, marginBottom: 16 },
  btn: { backgroundColor: '#3b82f6', borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginBottom: 24 },
  btnTxt: { color: '#fff', fontSize: 16, fontWeight: '600' },
  link: { alignItems: 'center' },
  linkTxt: { color: '#3b82f6', fontSize: 14 },
})
