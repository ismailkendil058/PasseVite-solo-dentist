import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { MessageSquareShare } from "lucide-react";

const PrivateFeedback = () => {
    const navigate = useNavigate();
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [patientName, setPatientName] = useState('');
    const [phone, setPhone] = useState('');
    const [feedback, setFeedback] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const { error } = await (await import('@/integrations/supabase/client')).supabase
                .from('review_submissions')
                .insert({
                    satisfied: false,
                    patient_name: patientName,
                    phone: phone,
                    feedback: feedback
                });

            if (error) throw error;

            toast({
                title: "Merci pour votre retour",
                description: "Votre message a été transmis à notre équipe.",
            });

            navigate('/merci');
        } catch (error) {
            console.error('Error submitting feedback:', error);
            toast({
                variant: "destructive",
                title: "Erreur",
                description: "Une erreur est survenue lors de l'envoi de votre message.",
            });
        } finally {
            setIsSubmitting(false);
        }
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
                    <CardContent className="p-8 space-y-8">
                        <div className="text-center space-y-3">
                            <h1 className="text-2xl md:text-3xl font-bold text-foreground leading-tight tracking-tight">
                                Nous sommes désolés
                            </h1>
                            <p className="text-sm text-muted-foreground font-medium uppercase tracking-wider">
                                Aidez-nous à nous améliorer
                            </p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-primary uppercase tracking-widest ml-1">Nom (Optionnel)</label>
                                <Input
                                    placeholder="Votre nom"
                                    value={patientName}
                                    onChange={(e) => setPatientName(e.target.value)}
                                    className="h-14 rounded-2xl bg-white/50 border-primary/10 focus:ring-primary/20 transition-all placeholder:text-muted-foreground/50"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-primary uppercase tracking-widest ml-1">Téléphone (Optionnel)</label>
                                <Input
                                    placeholder="0X XX XX XX XX"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    className="h-14 rounded-2xl bg-white/50 border-primary/10 focus:ring-primary/20 transition-all placeholder:text-muted-foreground/50"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-primary uppercase tracking-widest ml-1">Votre message</label>
                                <Textarea
                                    required
                                    placeholder="Que pouvons-nous améliorer ?"
                                    value={feedback}
                                    onChange={(e) => setFeedback(e.target.value)}
                                    className="min-h-[140px] rounded-2xl bg-white/50 border-primary/10 focus:ring-primary/20 transition-all resize-none placeholder:text-muted-foreground/50 p-4"
                                />
                            </div>

                            <Button
                                disabled={isSubmitting}
                                type="submit"
                                className="w-full h-16 rounded-2xl bg-primary hover:bg-primary/90 text-white font-bold text-lg shadow-lg shadow-primary/20 transition-all flex items-center justify-center gap-3"
                            >
                                <MessageSquareShare className="w-5 h-5" />
                                {isSubmitting ? "Envoi en cours..." : "Envoyer mon message"}
                            </Button>
                        </form>
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

export default PrivateFeedback;
