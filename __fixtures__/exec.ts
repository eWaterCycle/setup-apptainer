import type * as exec from '@actions/exec'
import { jest } from '@jest/globals'

export const exec = jest.fn<typeof exec.exec>()
export const getExecOutput = jest.fn<typeof exec.getExecOutput>()
