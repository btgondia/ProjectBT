import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Header from '../components/Header'
import Context from '../context/context'

describe('Header', () => {
  test('shows logout popup when logout is clicked', () => {
    render(
      <Context.Provider value={{ view: 0 }}>
        <MemoryRouter>
          <Header headerActions={<div data-testid="actions" />} />
        </MemoryRouter>
      </Context.Provider>
    )

    expect(screen.getByTestId('actions')).toBeInTheDocument()

    fireEvent.click(screen.getByText('Logout'))
    expect(screen.getByText(/Confirm Logout/i)).toBeInTheDocument()
  })
})
