import { ReactElement } from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { ThemeProvider, createTheme } from '@mui/material/styles'
import { CssBaseline } from '@mui/material'

const testTheme = createTheme()

// Custom render function that includes providers
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <BrowserRouter>
      <ThemeProvider theme={testTheme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </BrowserRouter>
  )
}

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options })

export * from '@testing-library/react'
export { customRender as render }

// Mock store helpers
export const mockProjectStore = {
  projects: [],
  activeProject: null,
  createProject: vi.fn(),
  deleteProject: vi.fn(),
  setActiveProject: vi.fn(),
  updateProject: vi.fn(),
}

export const mockDataStore = {
  workGroups: [],
  works: [],
  trains: [],
  timetableRows: [],
  createWorkGroup: vi.fn(),
  createWork: vi.fn(),
  createTrain: vi.fn(),
  createTimetableRow: vi.fn(),
  updateTrain: vi.fn(),
  deleteTrain: vi.fn(),
}

export const mockEditorStore = {
  stations: [],
  lines: [],
  trainTypePatterns: [],
  createStation: vi.fn(),
  createLine: vi.fn(),
  createTrainTypePattern: vi.fn(),
  updateStation: vi.fn(),
  deleteStation: vi.fn(),
}

// Wait for async operations in tests
export const waitForStoreUpdate = () => new Promise(resolve => setTimeout(resolve, 0))