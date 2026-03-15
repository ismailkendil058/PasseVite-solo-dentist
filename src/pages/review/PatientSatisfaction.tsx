import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Smile, Meh } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const PatientSatisfaction = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 relative overflow-hidden">
            {/* Decorative Background Elements */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[100px] animate-fade-in" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[100px] animate-fade-in" style={{ animationDelay: '0.3s' }} />

            <div className="w-full max-w-lg relative z-10 flex flex-col items-center">
                {/* Header Section */}
                <div className="text-center mb-10 animate-fade-in">
                    <div className="inline-block mb-4 p-2 rounded-2xl bg-white shadow-xl shadow-primary/10 animate-float border border-primary/5">
                        <img src="/VitalWeb.png" alt="PasseVite Logo" className="h-12 w-12 object-contain" />
                    </div>
                    <h1 className="text-4xl font-black text-primary tracking-tighter italic">
                        PasseVite
                    </h1>
                </div>

                {/* Main Card */}
                <Card className="w-full border border-white/40 dark:border-white/5 shadow-2xl shadow-primary/5 bg-white/50 dark:bg-black/20 backdrop-blur-md animate-slide-up">
                    <CardContent className="p-8 text-center space-y-8">
                        <div className="space-y-3">
                            <h2 className="text-2xl md:text-3xl font-bold text-foreground leading-tight tracking-tight">
                                Votre expérience vous a-t-elle satisfait ?
                            </h2>
                            <p className="text-sm text-muted-foreground font-medium uppercase tracking-wider">
                                Votre avis nous aide à grandir
                            </p>
                        </div>

                        <div className="grid grid-cols-1 gap-4 pt-2">
                            <Button
                                onClick={async () => {
                                    await (await import('@/integrations/supabase/client')).supabase
                                        .from('review_submissions')
                                        .insert({ satisfied: true });
                                    navigate('/avis-google');
                                }}
                                className="h-20 rounded-2xl bg-primary hover:bg-primary/90 text-white text-lg font-bold shadow-lg shadow-primary/20 transition-all duration-300 hover:scale-[1.02] flex items-center justify-center gap-4"
                            >
                                <div className="bg-white/20 p-2 rounded-xl">
                                    <Smile className="w-7 h-7" />
                                </div>
                                Oui, je suis satisfait
                            </Button>

                            <Button
                                variant="outline"
                                onClick={() => navigate('/feedback')}
                                className="h-16 rounded-2xl border-primary/10 bg-white/50 hover:bg-white text-foreground text-md font-semibold transition-all duration-300 hover:scale-[1.02] flex items-center justify-center gap-3"
                            >
                                <Meh className="w-5 h-5 text-muted-foreground" />
                                Non, je ne suis pas satisfait
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Footer */}
                <p className="mt-12 text-[10px] text-muted-foreground/50 uppercase tracking-[0.2em] animate-fade-in" style={{ animationDelay: '1s' }}>
                    &copy; {new Date().getFullYear()} PasseVite &bull; Excellence en Soins
                </p>
            </div>
        </div>
    );
};

export default PatientSatisfaction;
