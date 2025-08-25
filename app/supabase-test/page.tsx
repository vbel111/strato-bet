"use client"

import { createClient } from "@/lib/supabase/client"
import { useState } from "react"

export default function SupabaseTest() {
  const [testResult, setTestResult] = useState<string>("Click to test Supabase connection")
  const [isLoading, setIsLoading] = useState(false)

  const testConnection = async () => {
    setIsLoading(true)
    setTestResult("Testing connection...")
    
    try {
      const supabase = createClient()
      
      // Simple test - try to get the current session
      const { data, error } = await supabase.auth.getSession()
      
      if (error) {
        setTestResult(`❌ Supabase Error: ${error.message}`)
      } else {
        setTestResult(`✅ Supabase connection successful! Session: ${data.session ? 'Active' : 'None'}`)
      }
    } catch (error) {
      if (error instanceof Error) {
        setTestResult(`❌ Connection failed: ${error.message}`)
      } else {
        setTestResult(`❌ Unknown error: ${String(error)}`)
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen p-8">
      <h1 className="text-2xl font-bold mb-6">Supabase Connection Test</h1>
      
      <div className="space-y-4">
        <button 
          onClick={testConnection}
          disabled={isLoading}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {isLoading ? "Testing..." : "Test Supabase Connection"}
        </button>
        
        <div className="p-4 border rounded bg-gray-50">
          <pre className="whitespace-pre-wrap">{testResult}</pre>
        </div>

        <div className="mt-8">
          <h2 className="text-lg font-semibold mb-2">Environment Variables:</h2>
          <div className="space-y-1">
            <div>NEXT_PUBLIC_SUPABASE_URL: {process.env.NEXT_PUBLIC_SUPABASE_URL || 'Missing'}</div>
            <div>NEXT_PUBLIC_SUPABASE_ANON_KEY: {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Set' : 'Missing'}</div>
          </div>
        </div>
      </div>
    </div>
  )
}
