import React, { useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  SafeAreaView, Alert, ActivityIndicator,
} from 'react-native'
import { supabase } from '../lib/supabase'

export default function SignupScreen({ navigation }: any) {
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSignup = async () => {
    if (!displayName || !email || !password) { Alert.alert('Error', 'Please fill all fields'); return }
    if (password.length < 6) { Alert.alert('Error', 'Password must be at least 6 characters'); return }
    setLoading(true)
    const { error } = await supabase.auth.signUp({
      email, password,
      options: { data: { display_name: displayName } },
    })
    setLoading(false)
    if (error) Alert.alert('Signup failed', error.message)
    else { Alert.alert('Check your email', 'A confirmation link has been sent.'); navigation.navigate('Login') }
  }

  return (
    <SafeAreaView style={s.container}>
      <View style={s.inner}>
        <Text style={s.title}>Join DeepSleep 🌙</Text>
        <Text style={s.subtitle}>Create your account</Text>

        <TextInput style={s.input} placeholder="Display name" placeholderTextColor="#8b949e"
          autoCapitalize="words" value={displayName} onChangeText={setDisplayName} />
        <TextInput style={s.input} placeholder="Email" placeholderTextColor="#8b949e"
          autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail} />
        <TextInput style={s.input} placeholder="Password (min 6 chars)" placeholderTextColor="#8b949e"
          secureTextEntry value={password} onChangeText={setPassword} />

        <TouchableOpacity style={s.btn} onPress={handleSignup} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.btnTxt}>Sign up</Text>}
        </TouchableOpacity>

        <TouchableOpacity style={s.link} onPress={() => navigation.navigate('Login')}>
          <Text style={s.linkTxt}>Already have an account? Log in</Text>
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
