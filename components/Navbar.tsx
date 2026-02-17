import React from 'react'
import { Box } from 'lucide-react'
import { Button } from 'components/ui/Button'

function Navbar() {
    const handleAuthClick = async () => {}
    const isSignedIn = false 
    const username = 'John Doe'
  return (
    <header className='navbar'>
        <nav className='inner'>
            <div className='left'>
                <div className='brand'>
                    <Box className='logo'/>
                    <span className='name'>Architecture Visualizer</span>

                    <ul className='links'>
                        <a href='#'>Product</a>
                        <a href='#'>Pricing</a>
                        <a href='#'>Community</a>
                        <a href='#'>Enterprise</a>
                    </ul>
                </div>
                <div className='actions'>
                    {isSignedIn ? (
                        <>
                            <span className='greeting'>
                                {username ? `Hi, ${username}` : 'Signed in'}    
                            </span>

                            <Button size="sm" onClick={handleAuthClick}>
                                Log out
                            </Button>
                        </>
                    ) : (
                        <>
                            <Button
                            onClick={handleAuthClick}
                            size='sm'
                            variant='secondary'
                            >
                                Log in
                            </Button>

                            <a href='#upload' className='cta'>
                                Get Started
                            </a>
                        </>
                    )}
                   
                </div>
            </div>
        </nav>
    </header>
  )
}

export default Navbar