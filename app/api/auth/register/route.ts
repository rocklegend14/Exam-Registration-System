import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { name, email, password, roll_number, department } = body;

        // Validate required fields
        if (!name || !email || !password || !roll_number || !department) {
            return NextResponse.json(
                { message: 'All fields are required' },
                { status: 400 }
            );
        }

        console.log('Making request to backend with data:', { name, email, roll_number, department });

        // Make request to backend
        const response = await fetch('https://exam-registration-system-6ncs.onrender.com/api/students/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                name,
                email,
                password,
                roll_number,
                department
            }),
        }).catch(error => {
            console.error('Network error:', error);
            throw new Error('Could not connect to the server. Please make sure the backend server is running.');
        });

        if (!response) {
            throw new Error('No response from server');
        }

        const data = await response.json();

        if (!response.ok) {
            return NextResponse.json(
                { message: data.message || 'Registration failed' },
                { status: response.status }
            );
        }

        return NextResponse.json(data, { status: 201 });
    } catch (error) {
        console.error('Registration error:', error);
        return NextResponse.json(
            { 
                message: error instanceof Error ? error.message : 'Internal server error',
                details: error instanceof Error ? error.stack : undefined
            },
            { status: 500 }
        );
    }
} 