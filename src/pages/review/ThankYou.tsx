import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { CheckCircle2, Home } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const ThankYou = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 relative overflow-hidden">
            {/* Decorative Background Elements */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[100px] animate-fade-in" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[100px] animate-fade-in" style={{ animationDelay: '0.3s' }} />

            <div className="w-full max-w-lg relative z-10 flex flex-col items-center">
                {/* Header Section */}
                <div className="text-center mb-8 animate-fade-in">
                    <div className="inline-block mb-4 p-2 rounded-2xl bg-white shadow-xl shadow-primary/10 animate-float border border-primary/5">
                        <img src="/VitalWeb.png" alt="PasseVite Logo" className="h-12 w-12 object-contain" />
                    </div>
                </div>

                {/* Main Card */}
                <Card className="w-full border border-white/40 dark:border-white/5 shadow-2xl shadow-primary/5 bg-white/50 dark:bg-black/20 backdrop-blur-md animate-slide-up">
                    <CardContent className="p-10 text-center space-y-8">
                        <div className="flex justify-center">
                            <div className="w-24 h-24 bg-primary/5 rounded-3xl flex items-center justify-center animate-bounce shadow-inner shadow-primary/10">
                                <CheckCircle2 className="w-12 h-12 text-primary" />
                            </div>
                        </div>

                        <div className="space-y-3">
                            <h1 className="text-3xl font-bold text-foreground tracking-tight">
                                Merci pour votre retour
                            </h1>
                            <p className="text-sm text-muted-foreground font-medium uppercase tracking-wider leading-relaxed">
                                Votre message a bien été transmis
                            </p>
                        </div>

                        <div className="pt-4">
                            <Button
                                onClick={() => navigate('/review')}
                                variant="outline"
                                className="w-full h-16 rounded-2xl border-primary/10 bg-white/50 hover:bg-white text-foreground font-bold text-lg transition-all flex items-center justify-center gap-3"
                            >
                                <Home className="w-5 h-5" />
                                Retour à l'accueil
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

export default ThankYou;
