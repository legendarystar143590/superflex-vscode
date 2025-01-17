import { v4 as uuidv4 } from 'uuid';
import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

import { MessageType, Role } from '../../../../shared/model';
import { FilePayload, InitState } from '../../../../shared/protocol';
import { ChatMessage } from '../message/ChatMessage.model';

const defaultMessages: ChatMessage[] = [
  {
    id: uuidv4(),
    role: Role.Assistant,
    type: MessageType.Text,
    content:
      "Welcome to Superflex! I'm here to help turn your ideas into reality in seconds. Let’s work together and get things done—tell me what you'd like to build today!"
  }
];

type ChatState = {
  init: InitState;
  messages: ChatMessage[];
  isMessageProcessing: boolean;
  isProjectSyncing: boolean;
  files: FilePayload[];
  selectedFiles: FilePayload[];
};

const initialState: ChatState = {
  init: {
    isInitialized: false,
    isFigmaAuthenticated: false
  },
  messages: defaultMessages,
  isMessageProcessing: false,
  isProjectSyncing: false,
  files: [],
  selectedFiles: []
};

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    setInitState: (state, action: PayloadAction<Partial<InitState>>) => {
      state.init = { ...state.init, ...action.payload };
    },
    addMessages: (state, action: PayloadAction<ChatMessage[]>) => {
      state.messages = [...state.messages, ...action.payload];
    },
    clearMessages(state) {
      state.messages = defaultMessages;
    },
    setIsMessageProcessing: (state, action: PayloadAction<boolean>) => {
      state.isMessageProcessing = action.payload;
    },
    setIsProjectSyncing: (state, action: PayloadAction<boolean>) => {
      state.isProjectSyncing = action.payload;
    },
    setProjectFiles: (state, action: PayloadAction<FilePayload[]>) => {
      state.files = action.payload;
    },
    setSelectedFiles: (state, action: PayloadAction<FilePayload[]>) => {
      state.selectedFiles = action.payload;
    },
    addSelectedFile: (state, action: PayloadAction<FilePayload>) => {
      if (action.payload.isCurrentOpenFile) {
        state.selectedFiles = [
          action.payload,
          ...state.selectedFiles.filter((f) => !f.isCurrentOpenFile && f.relativePath !== action.payload.relativePath)
        ];
        return;
      }
      if (state.selectedFiles.find((f) => f.relativePath === action.payload.relativePath)) {
        return;
      }

      state.selectedFiles = [...state.selectedFiles, action.payload];
    },
    removeSelectedFile: (state, action: PayloadAction<FilePayload>) => {
      state.selectedFiles = state.selectedFiles.filter((file) => file.relativePath !== action.payload.relativePath);
    }
  }
});

export const {
  setInitState,
  addMessages,
  clearMessages,
  setIsMessageProcessing,
  setIsProjectSyncing,
  setProjectFiles,
  setSelectedFiles,
  addSelectedFile,
  removeSelectedFile
} = chatSlice.actions;

export default chatSlice.reducer;
