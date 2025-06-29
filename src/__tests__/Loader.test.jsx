import { render } from '@testing-library/react'
import Loader from '../components/Loader'

describe('Loader', () => {
  test('renders overlay when visible', () => {
    const { container } = render(<Loader visible={true} />)
    expect(container.querySelector('.overlay')).toBeInTheDocument()
  })

  test('does not render overlay when not visible', () => {
    const { container } = render(<Loader visible={false} />)
    expect(container.querySelector('.overlay')).toBeNull()
  })
})
