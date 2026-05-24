import { useState } from 'react';
import { useNavigate, useLocation, Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui';
import { Mail, ShieldCheck, ArrowRight, ArrowLeft, KeyRound } from 'lucide-react';
import { KoveraLogo } from '@/components/common/KoveraLogo';

const STEP_EMAIL = 'email';
const STEP_OTP = 'otp';
const STEP_PICK = 'pick';

// Human-readable label for the identity provider. Kept tiny on purpose —
// promote to a shared helper once a second caller appears.
function identityLabel(identity) {
    switch (identity.provider) {
        case 'password':
            return 'Email & password';
        case 'google':
            return 'Google';
        case 'facebook':
            return 'Facebook';
        default:
            return identity.provider;
    }
}

export default function Login() {
    const { requestLoginCode, verifyLoginCode, claimIdentity, isAuthenticated } =
        useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const [step, setStep] = useState(STEP_EMAIL);
    const [email, setEmail] = useState('');
    const [code, setCode] = useState('');
    const [identities, setIdentities] = useState([]);
    const [identitySelectionToken, setIdentitySelectionToken] = useState('');
    const [chosenIdentityId, setChosenIdentityId] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const from = location.state?.from || '/dashboard';
    if (isAuthenticated) {
        return <Navigate to={from} replace />;
    }

    const handleEmailSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        const result = await requestLoginCode(email);
        setLoading(false);
        if (result.success) {
            setStep(STEP_OTP);
        } else {
            setError(result.error);
        }
    };

    const handleOtpSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        const result = await verifyLoginCode(email, code);
        setLoading(false);
        if (!result.success) {
            setError(result.error);
            return;
        }
        if (result.kind === 'session') {
            navigate(from, { replace: true });
            return;
        }
        // Multi-identity branch: server returned a selection token + list.
        setIdentitySelectionToken(result.identitySelectionToken);
        setIdentities(result.identities);
        setChosenIdentityId(result.identities[0]?.id ?? '');
        setStep(STEP_PICK);
    };

    const handleClaimSubmit = async (e) => {
        e.preventDefault();
        if (!chosenIdentityId) return;
        setError('');
        setLoading(true);
        const result = await claimIdentity({
            identitySelectionToken,
            identityId: chosenIdentityId,
        });
        setLoading(false);
        if (result.success) {
            navigate(from, { replace: true });
        } else {
            setError(result.error);
            // Token may have expired — bounce back to the email step so the
            // user can request a fresh OTP rather than retry a dead token.
            if (result.code === 'invalid_identity_selection') {
                setStep(STEP_EMAIL);
                setCode('');
                setIdentities([]);
                setIdentitySelectionToken('');
            }
        }
    };

    const backToEmail = () => {
        setStep(STEP_EMAIL);
        setCode('');
        setError('');
        setIdentities([]);
        setIdentitySelectionToken('');
    };

    return (
        <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
            <div className="absolute inset-0 z-0">
                <img
                    src="/login-bg.png"
                    alt="Modern luxury house at twilight"
                    className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-br from-navy-950/90 via-navy-950/80 to-navy-900/70" />
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_20%,rgba(10,14,26,0.7)_100%)]" />
            </div>

            <div className="absolute inset-0 z-[1] overflow-hidden pointer-events-none">
                <div className="absolute top-1/3 -left-40 w-[500px] h-[500px] bg-primary/8 rounded-full blur-[120px]" />
                <div className="absolute bottom-1/4 -right-40 w-[400px] h-[400px] bg-primary/6 rounded-full blur-[100px]" />
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[200px] bg-primary/4 rounded-full blur-[80px]" />
            </div>

            <div className="relative z-10 w-full max-w-[440px] mx-4 animate-slide-up">
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl gradient-primary mb-5 shadow-lg shadow-primary/30 ring-1 ring-white/10">
                        <KoveraLogo size={32} color="#ffffff" />
                    </div>
                    <h1 className="text-3xl font-bold text-white tracking-tight">
                        {step === STEP_EMAIL && (
                            <>
                                Welcome to{' '}
                                <span className="text-gradient">Kovera</span>{' '}
                                Admin
                            </>
                        )}
                        {step === STEP_OTP && <>Enter your code</>}
                        {step === STEP_PICK && <>Choose how to sign in</>}
                    </h1>
                    <p className="text-muted mt-2 text-sm">
                        {step === STEP_EMAIL &&
                            'Sign in with a one-time code sent to your email.'}
                        {step === STEP_OTP &&
                            `We sent a 6-digit code to ${email}.`}
                        {step === STEP_PICK &&
                            'This account has more than one sign-in method.'}
                    </p>
                </div>

                <div className="rounded-2xl bg-navy-900/60 backdrop-blur-2xl border border-white/[0.08] p-6 sm:p-8 shadow-elevated">
                    {error && (
                        <div className="mb-5 flex items-center gap-3 p-3.5 rounded-xl bg-danger/10 border border-danger/20 animate-scale-in">
                            <div className="shrink-0 w-8 h-8 rounded-lg bg-danger/15 flex items-center justify-center">
                                <svg
                                    className="w-4 h-4 text-danger"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    strokeWidth={2}
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
                                    />
                                </svg>
                            </div>
                            <p className="text-sm text-danger-light">{error}</p>
                        </div>
                    )}

                    {step === STEP_EMAIL && (
                        <form onSubmit={handleEmailSubmit} className="space-y-5">
                            <div className="space-y-1.5">
                                <label
                                    htmlFor="login-email"
                                    className="block text-sm font-medium text-white/80"
                                >
                                    Email Address
                                </label>
                                <div className="relative group">
                                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors pointer-events-none" />
                                    <input
                                        id="login-email"
                                        type="email"
                                        autoComplete="email"
                                        required
                                        placeholder="you@kovera.io"
                                        value={email}
                                        onChange={(e) =>
                                            setEmail(e.target.value)
                                        }
                                        className="w-full h-11 pl-10 pr-4 rounded-xl bg-navy-950/60 border border-white/[0.08] text-sm text-white placeholder:text-muted-foreground transition-all duration-200 focus:outline-none focus:border-primary/50 focus:shadow-[0_0_0_3px_rgba(34,197,94,0.12)] hover:border-white/[0.15]"
                                    />
                                </div>
                            </div>
                            <Button
                                type="submit"
                                className="w-full h-11 text-sm font-semibold"
                                loading={loading}
                                disabled={loading}
                            >
                                {!loading && (
                                    <>
                                        Send code
                                        <ArrowRight className="w-4 h-4" />
                                    </>
                                )}
                                {loading && 'Sending…'}
                            </Button>
                        </form>
                    )}

                    {step === STEP_OTP && (
                        <form onSubmit={handleOtpSubmit} className="space-y-5">
                            <div className="space-y-1.5">
                                <label
                                    htmlFor="login-otp"
                                    className="block text-sm font-medium text-white/80"
                                >
                                    Verification code
                                </label>
                                <div className="relative">
                                    <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                                    <input
                                        id="login-otp"
                                        type="text"
                                        inputMode="numeric"
                                        autoComplete="one-time-code"
                                        pattern="[0-9]{6}"
                                        maxLength={6}
                                        required
                                        placeholder="123456"
                                        value={code}
                                        onChange={(e) =>
                                            setCode(
                                                e.target.value.replace(
                                                    /\D/g,
                                                    '',
                                                ),
                                            )
                                        }
                                        className="w-full h-12 pl-10 pr-4 rounded-xl bg-navy-950/60 border border-white/[0.08] text-center text-lg tracking-[0.5em] font-mono text-white placeholder:text-muted-foreground transition-all duration-200 focus:outline-none focus:border-primary/50 focus:shadow-[0_0_0_3px_rgba(34,197,94,0.12)] hover:border-white/[0.15]"
                                    />
                                </div>
                            </div>
                            <Button
                                type="submit"
                                className="w-full h-11 text-sm font-semibold"
                                loading={loading}
                                disabled={loading || code.length !== 6}
                            >
                                {!loading && (
                                    <>
                                        Sign in
                                        <ArrowRight className="w-4 h-4" />
                                    </>
                                )}
                                {loading && 'Verifying…'}
                            </Button>
                            <button
                                type="button"
                                onClick={backToEmail}
                                className="w-full flex items-center justify-center gap-2 text-sm text-muted hover:text-white transition-colors cursor-pointer"
                            >
                                <ArrowLeft className="w-3.5 h-3.5" />
                                Use a different email
                            </button>
                        </form>
                    )}

                    {step === STEP_PICK && (
                        <form
                            onSubmit={handleClaimSubmit}
                            className="space-y-5"
                        >
                            <fieldset className="space-y-2">
                                <legend className="text-sm font-medium text-white/80 mb-2">
                                    Sign-in method
                                </legend>
                                {identities.map((identity) => {
                                    const checked =
                                        chosenIdentityId === identity.id;
                                    return (
                                        <label
                                            key={identity.id}
                                            className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                                                checked
                                                    ? 'border-primary/60 bg-primary/10'
                                                    : 'border-white/[0.08] bg-navy-950/40 hover:border-white/[0.15]'
                                            }`}
                                        >
                                            <input
                                                type="radio"
                                                name="identity"
                                                className="sr-only"
                                                checked={checked}
                                                onChange={() =>
                                                    setChosenIdentityId(
                                                        identity.id,
                                                    )
                                                }
                                            />
                                            <ShieldCheck
                                                className={`w-4 h-4 ${checked ? 'text-primary' : 'text-muted-foreground'}`}
                                            />
                                            <span className="text-sm text-white">
                                                {identityLabel(identity)}
                                            </span>
                                        </label>
                                    );
                                })}
                            </fieldset>
                            <Button
                                type="submit"
                                className="w-full h-11 text-sm font-semibold"
                                loading={loading}
                                disabled={loading || !chosenIdentityId}
                            >
                                {!loading && (
                                    <>
                                        Continue
                                        <ArrowRight className="w-4 h-4" />
                                    </>
                                )}
                                {loading && 'Signing in…'}
                            </Button>
                            <button
                                type="button"
                                onClick={backToEmail}
                                className="w-full flex items-center justify-center gap-2 text-sm text-muted hover:text-white transition-colors cursor-pointer"
                            >
                                <ArrowLeft className="w-3.5 h-3.5" />
                                Start over
                            </button>
                        </form>
                    )}
                </div>

                <p className="text-center text-xs text-muted-foreground/60 mt-8">
                    © 2026 Kovera. All rights reserved.
                </p>
            </div>
        </div>
    );
}
