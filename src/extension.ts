require("dotenv").config();

import * as vscode from "vscode";

import { ChatAPI } from "./chat/ChatApi";
import ChatViewProvider from "./chat/ChatViewProvider";
import registerChatWidgetWebview from "./chat/chatWidgetWebview";
import { AUTH_PROVIDER_ID } from "./common/constants";
import ElementAIAuthenticationProvider from "./authentication/ElementAIAuthenticationProvider";
import ElementAIAuthenticationService from "./authentication/ElementAIAuthenticationService";
import { ElementAICache } from "./cache/ElementAICache";
import { AIProvider } from "./providers/AIProvider";
import OpenAIProvider from "./providers/OpenAIProvider";
import { getOpenWorkspace } from "./common/utils";

type AppState = {
  aiProvider: AIProvider;
  chatApi: ChatAPI;
  authService: ElementAIAuthenticationService;
  authProvider: ElementAIAuthenticationProvider;
  chatViewProvider: ChatViewProvider;
};

export async function activate(context: vscode.ExtensionContext): Promise<void> {
  const aiProvider = new OpenAIProvider();
  const chatApi = new ChatAPI(aiProvider);
  const chatWebviewProvider = new ChatViewProvider(context, chatApi);
  const authService = new ElementAIAuthenticationService(chatWebviewProvider, aiProvider);

  const appState: AppState = {
    aiProvider: aiProvider,
    chatApi: chatApi,
    authService: authService,
    authProvider: new ElementAIAuthenticationProvider(context, authService),
    chatViewProvider: chatWebviewProvider,
  };

  // Do not await on this function as we do not want VSCode to wait for it to finish
  // before considering Element AI ready to operate.
  void backgroundInit(context, appState);

  return Promise.resolve();
}

async function backgroundInit(context: vscode.ExtensionContext, appState: AppState) {
  registerElementAICache(context);
  registerAuthenticationProviders(context, appState);
  registerChatWidgetWebview(context, appState.chatViewProvider);
}

function registerElementAICache(context: vscode.ExtensionContext): void {
  ElementAICache.setStoragePath(context.storageUri?.toString());
  ElementAICache.setGlobalStoragePath(context.globalStorageUri.toString());

  const openWorkspace = getOpenWorkspace();
  if (openWorkspace) {
    ElementAICache.setWorkspaceFolderPath(openWorkspace.uri.toString());
  }
}

async function registerAuthenticationProviders(context: vscode.ExtensionContext, state: AppState): Promise<void> {
  context.subscriptions.push(state.authProvider);

  context.subscriptions.push(
    vscode.commands.registerCommand(`${AUTH_PROVIDER_ID}.signin`, () => state.authService.signIn(state.authProvider)),
    vscode.commands.registerCommand(`${AUTH_PROVIDER_ID}.signout`, () => state.authService.signOut(state.authProvider))
  );

  state.chatApi.registerEvent("login_clicked", async () => {
    await state.authService.signIn(state.authProvider);
  });

  state.authService.authenticate(state.authProvider);
}

// This method is called when your extension is deactivated
export function deactivate() {}
