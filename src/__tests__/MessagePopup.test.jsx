import { render, screen, fireEvent } from '@testing-library/react'
import MessagePopup from '../components/MessagePopup'

describe('MessagePopup', () => {
  test('calls handlers on button clicks', () => {
    const onClose = vi.fn()
    const onSave = vi.fn()

    render(
      <MessagePopup
        onClose={onClose}
        onSave={onSave}
        message="Test Message"
        button1="Ok"
        button2="Cancel"
      />
    )

    fireEvent.click(screen.getByText('Cancel'))
    expect(onSave).toHaveBeenCalled()

    fireEvent.click(screen.getByText('Ok'))
    expect(onClose).toHaveBeenCalled()
  })
})
