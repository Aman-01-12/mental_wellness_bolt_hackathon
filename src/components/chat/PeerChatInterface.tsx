import React, { useState, useRef, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Users, ArrowLeft, Send, RotateCcw } from 'lucide-react';
import { Navigation } from '../ui/Navigation';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/authStore';
import { LoadingSpinner } from '../ui/LoadingSpinner';

export function PeerChatInterface() {
  return <div>Peer Chat Interface (implement me)</div>;
} 