import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import LoginPage from '../users/LoginPage'
import Context from '../context/context'

describe('LoginPage', () => {
  it('renders login button', () => {
    render(
      <Context.Provider value={{ setNotification: () => {} }}>
        <MemoryRouter>
          <LoginPage setUserType={() => {}} />
        </MemoryRouter>
      </Context.Provider>
    )
    expect(screen.getByText(/Login now/i)).toBeInTheDocument()
  })
})
