import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import type { PayloadAction } from '@reduxjs/toolkit'
import type { WebSocketMessage } from '../types'

// Mock WebSocket connection - will be replaced with real implementation later
let mockWebSocket: any = null

const createMockWebSocket = () => {
  // Simulate WebSocket connection
  mockWebSocket = {
    send: (message: string) => {
      console.log('WebSocket message sent:', message)
      // In real implementation, this would send to actual WebSocket server
    },
    close: () => {
      console.log('WebSocket connection closed')
      mockWebSocket = null
    }
  }
  return mockWebSocket
}

export const connectWebSocket = createAsyncThunk(
  'webSocket/connect',
  async (_, { dispatch }) => {
    try {
      // Simulate connection delay
      await new Promise(resolve => setTimeout(resolve, 500))
      
      const ws = createMockWebSocket()
      
      // Send initial connection message
      ws.send(JSON.stringify({
        type: 'connection',
        data: { clientId: 'eye-tracking-app' },
        timestamp: Date.now()
      }))
      
      return true
    } catch (error) {
      throw new Error('Failed to connect to WebSocket server')
    }
  }
)

export const disconnectWebSocket = createAsyncThunk(
  'webSocket/disconnect',
  async () => {
    if (mockWebSocket) {
      mockWebSocket.close()
    }
    return false
  }
)

export const sendWebSocketMessage = createAsyncThunk(
  'webSocket/sendMessage',
  async (message: WebSocketMessage, { getState }) => {
    if (mockWebSocket) {
      mockWebSocket.send(JSON.stringify(message))
      
      const state = getState() as any
      return state.webSocket.messagesSent + 1
    }
    throw new Error('WebSocket not connected')
  }
)

const webSocketSlice = createSlice({
  name: 'webSocket',
  initialState: {
    isConnected: false,
    isConnecting: false,
    error: null as string | null,
    messagesSent: 0,
  },
  reducers: {
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload
    },
    clearError: (state) => {
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(connectWebSocket.pending, (state) => {
        state.isConnecting = true
        state.error = null
      })
      .addCase(connectWebSocket.fulfilled, (state) => {
        state.isConnected = true
        state.isConnecting = false
        state.error = null
      })
      .addCase(connectWebSocket.rejected, (state, action) => {
        state.isConnected = false
        state.isConnecting = false
        state.error = action.error.message || 'Connection failed'
      })
      .addCase(disconnectWebSocket.fulfilled, (state) => {
        state.isConnected = false
        state.isConnecting = false
        state.error = null
      })
      .addCase(sendWebSocketMessage.fulfilled, (state, action) => {
        state.messagesSent = action.payload
      })
      .addCase(sendWebSocketMessage.rejected, (state, action) => {
        state.error = action.error.message || 'Failed to send message'
      })
  },
})

export const { setError, clearError } = webSocketSlice.actions
export default webSocketSlice.reducer 