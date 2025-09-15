/**
 * VS Code API Context
 * Provides access to VS Code API and webview state
 */

import type React from 'react'
import { createContext, useContext } from 'react'
import type { AppAction, AppState, ToastNotification } from '../types'

export interface VSCodeContextValue {
	vscode?: ReturnType<NonNullable<typeof window.acquireVsCodeApi>>
	state: AppState
	dispatch: React.Dispatch<AppAction>
	sendMessage: (message: any) => Promise<any>
	availableHeight: number
	// Toast notification functions
	showSuccessToast: (title: string, message: string, duration?: number) => void
	showInfoToast: (title: string, message: string, duration?: number) => void
	showWarningToast: (title: string, message: string, duration?: number) => void
	showErrorToast: (title: string, message: string, duration?: number) => void
}

export const VSCodeContext = createContext<VSCodeContextValue | undefined>(undefined)

export const useVSCodeContext = () => {
	const context = useContext(VSCodeContext)
	if (!context) {
		throw new Error('useVSCodeContext must be used within VSCodeProvider')
	}
	return context
}
