import React from 'react';
import { Button } from "@/components/ui/button";
import { Star, CheckCircle2 } from "lucide-react";
import { REVIEW_CONFIG } from "@/config/review";
import { Card, CardContent } from "@/components/ui/card";

const GoogleReview = () => {
    const handleReviewClick = () => {
        window.location.href = REVIEW_CONFIG.googleReviewLink;
    };

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
                    <CardContent className="p-8 text-center space-y-8">
                        <div className="space-y-3">
                            <h1 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight">
                                Merci pour votre confiance
                            </h1>
                            <p className="text-sm text-muted-foreground font-medium uppercase tracking-wider">
                                Votre avis aide d'autres patients
                            </p>
                        </div>

                        {/* Stars Display */}
                        <div className="flex justify-center gap-3 py-2">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                    key={star}
                                    className="w-10 h-10 fill-yellow-400 text-yellow-400 animate-float"
                                    style={{ animationDelay: `${star * 0.1}s` }}
                                />
                            ))}
                        </div>

                        {/* Main CTA */}
                        <div className="space-y-6">
                            <Button
                                onClick={handleReviewClick}
                                className="w-full h-18 py-8 rounded-2xl bg-[#4285F4] hover:bg-[#4285F4]/90 text-white text-lg font-bold shadow-lg shadow-blue-500/20 transition-all duration-300 hover:scale-[1.02] flex items-center justify-center gap-3"
                            >
                                <img src="https://www.google.com/favicon.ico" className="w-6 h-6 rounded-sm bg-white p-0.5" alt="Google" />
                                Laisser un avis sur Google
                            </Button>

                            {/* Instructions */}
                            <div className="bg-primary/5 rounded-2xl p-6 text-left space-y-4 border border-primary/10">
                                <div className="flex items-center gap-2 text-primary font-bold text-sm">
                                    <CheckCircle2 className="w-4 h-4" />
                                    <span>Guide rapide (30 secondes)</span>
                                </div>
                                <ol className="text-muted-foreground text-sm space-y-3">
                                    <li className="flex gap-3 items-start">
                                        <span className="bg-primary/10 text-primary w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">1</span>
                                        Cliquez sur le bouton bleu ci-dessus
                                    </li>
                                    <li className="flex gap-3 items-start">
                                        <span className="bg-primary/10 text-primary w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">2</span>
                                        Choisissez <span className="text-foreground font-semibold">5 étoiles</span>
                                    </li>
                                    <li className="flex gap-3 items-start">
                                        <span className="bg-primary/10 text-primary w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">3</span>
                                        Partagez un court commentaire
                                    </li>
                                </ol>
                            </div>
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

export default GoogleReview;
