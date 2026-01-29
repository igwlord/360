import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useTasks } from '../useTasks'

// Mock localStorage
const localStorageMock = (() => {
  let store = {}
  return {
    getItem: (key) => store[key] || null,
    setItem: (key, value) => { store[key] = value.toString() },
    removeItem: (key) => { delete store[key] },
    clear: () => { store = {} }
  }
})()

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
})

describe('useTasks', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('should initialize with empty tasks', () => {
    const { result } = renderHook(() => useTasks())
    expect(result.current.tasks).toEqual([])
  })

  it('should add a new task', () => {
    const { result } = renderHook(() => useTasks())
    
    act(() => {
      result.current.addTask({
        text: 'Test task',
        priority: 'high',
        date: new Date().toISOString()
      })
    })

    expect(result.current.tasks).toHaveLength(1)
    expect(result.current.tasks[0].text).toBe('Test task')
    expect(result.current.tasks[0].done).toBe(false)
  })

  it('should toggle task completion', () => {
    const { result } = renderHook(() => useTasks())
    
    let taskId
    act(() => {
      result.current.addTask({
        text: 'Test task',
        priority: 'high',
        date: new Date().toISOString()
      })
      taskId = result.current.tasks[0].id
    })

    act(() => {
      result.current.toggleTask(taskId)
    })

    expect(result.current.tasks[0].done).toBe(true)
  })

  it('should delete a task', () => {
    const { result } = renderHook(() => useTasks())
    
    let taskId
    act(() => {
      result.current.addTask({
        text: 'Test task',
        priority: 'high',
        date: new Date().toISOString()
      })
      taskId = result.current.tasks[0].id
    })

    expect(result.current.tasks).toHaveLength(1)

    act(() => {
      result.current.deleteTask(taskId)
    })

    expect(result.current.tasks).toHaveLength(0)
  })
})
