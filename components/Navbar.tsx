import React from 'react'
import { Box } from 'lucide-react'
import { Button } from 'components/ui/Button'
import { useOutlet, useOutletContext } from 'react-router'

function Navbar() {
    const handleAuthClick = async () => {
        if(isSignedIn) {
            try {
                await signOut()
            } catch (err) {
                console.error(`Puter sign out failed: ${err}`)
            }

            return
        }   

        try {
            await signIn()
        } catch (err) {
            console.error(`Puter sign out failed: ${err}`)
        }
    }
    
    const {isSignedIn, userName, signIn, signOut} = useOutletContext<AuthContext>()
    
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
                                {userName ? `Hi, ${userName}` : 'Signed in'}    
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
