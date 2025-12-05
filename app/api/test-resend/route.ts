import { NextResponse } from 'next/server';

export async function GET() {
    try {
        // Intentar obtener la API key
        let apiKey: string;
        let source: string;

        try {
            const { getResendApiKey } = await import("@/lib/resend");
            apiKey = await getResendApiKey();
            source = 'database';
        } catch (error: any) {
            apiKey = process.env.RESEND_API_KEY || "";
            source = 'environment';
        }

        if (!apiKey) {
            return NextResponse.json({
                success: false,
                error: 'No se encontró RESEND_API_KEY en la base de datos ni en variables de entorno',
                source: 'none',
            }, { status: 500 });
        }

        // Verificar que la API key tenga el formato correcto
        if (!apiKey.startsWith('re_')) {
            return NextResponse.json({
                success: false,
                error: 'La API key no tiene el formato correcto (debe empezar con "re_")',
                source,
                keyPreview: apiKey.substring(0, 10) + '...',
            }, { status: 500 });
        }

        // Intentar hacer una petición de prueba a Resend
        const testResponse = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                from: 'onboarding@resend.dev',
                to: 'test@example.com', // Email de prueba que Resend rechazará pero validará la API key
                subject: 'Test',
                html: '<p>Test</p>',
            }),
        });

        const testData = await testResponse.json();

        if (testResponse.status === 401 || testResponse.status === 403) {
            return NextResponse.json({
                success: false,
                error: 'API key inválida o expirada',
                source,
                keyPreview: apiKey.substring(0, 10) + '...',
                resendError: testData,
            }, { status: 500 });
        }

        // Si llegamos aquí, la API key es válida (aunque el email de prueba falle)
        return NextResponse.json({
            success: true,
            message: 'Resend API key configurada correctamente',
            source,
            keyPreview: apiKey.substring(0, 10) + '...',
            note: 'La API key es válida. Si los emails fallan, verifica el dominio del remitente.',
        });

    } catch (error: any) {
        console.error('Error testing Resend:', error);
        return NextResponse.json({
            success: false,
            error: error.message || 'Error desconocido',
        }, { status: 500 });
    }
}
