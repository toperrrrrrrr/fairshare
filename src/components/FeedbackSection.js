import React, { useState } from 'react';
import { db } from '../services/firebase';
import { useAuth } from '../hooks/useAuth';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import './FeedbackSection.css';

export default function FeedbackSection() {
  const { user } = useAuth();
  const [feedback, setFeedback] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!feedback.trim()) {
      setError('Please enter your feedback.');
      return;
    }
    setSubmitting(true);
    try {
      await addDoc(collection(db, 'feedback'), {
        userId: user.uid,
        username: user.username || user.email,
        message: feedback,
        createdAt: serverTimestamp(),
      });
      setFeedback('');
      setSuccess('Thank you for your feedback!');
    } catch (err) {
      setError('Failed to submit feedback.');
    }
    setSubmitting(false);
  };

  return (
    <div className="feedback-section-root">
      <h3>Send Feedback</h3>
      <form onSubmit={handleSubmit} className="feedback-form">
        <textarea
          className="feedback-textarea"
          value={feedback}
          onChange={e => setFeedback(e.target.value)}
          placeholder="Let us know what you think, found a bug, or want a new feature..."
          rows={4}
          disabled={submitting}
        />
        <button className="feedback-submit-btn" type="submit" disabled={submitting || !feedback.trim()}>
          {submitting ? 'Sending...' : 'Send Feedback'}
        </button>
        {success && <div className="feedback-success">{success}</div>}
        {error && <div className="feedback-error">{error}</div>}
      </form>
    </div>
  );
}
