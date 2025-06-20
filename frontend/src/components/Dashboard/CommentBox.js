import React, { useState, useEffect } from 'react';
import axios from 'axios';
import moment from 'moment';
import io from 'socket.io-client';
import '../../styles/CommentBox.css';

const CommentBox = ({ task, fetchTasks, onClose }) => {
  const [newComment, setNewComment] = useState('');
  const [comments, setComments] = useState(task.comments || []);
  const currentUser = JSON.parse(localStorage.getItem('user'));

  // Lock background scroll when modal is open
  useEffect(() => {
    document.body.classList.add('modal-open');
    return () => document.body.classList.remove('modal-open');
  }, []);

  // Update comments when task changes
  useEffect(() => setComments(task.comments || []), [task]);

  // Real-time updates via socket
  useEffect(() => {
    const socket = io('http://localhost:5000', { query: { token: localStorage.getItem('token') } });
    socket.emit('joinTaskRoom', task._id);
    socket.on('newComment', (data) => {
      if (data.taskId === task._id) setComments((prev) => [...prev, data.comment]);
    });
    return () => { socket.emit('leaveTaskRoom', task._id); socket.disconnect(); };
  }, [task._id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `http://localhost:5000/api/tasks/${task._id}/comments`,
        { text: newComment, authorId: currentUser._id, authorName: currentUser.name },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setNewComment('');
      document.querySelector('.moss-comment-input').style.height = 'auto';
      fetchTasks();
    } catch (err) {
      console.error('Error adding comment:', err);
    }
  };

  return (
    <div className="ti-modal-backdrop" onClick={onClose}>
      <div className="ti-modal-content" onClick={(e) => e.stopPropagation()}>
        <h2 className="ti-modal-title">Comments for {task.title}</h2>
        <div className="moss-comments-list">
          {comments.length ? (
            comments.map((c, i) => (
              <div key={i} className="moss-comment-item">
                <div className="moss-comment-header">
                  <span className="moss-comment-author">{c.authorName}</span>
                  <span className="moss-comment-date">{moment(c.createdAt).fromNow()}</span>
                </div>
                <p className="moss-comment-text">{c.text}</p>
              </div>
            ))
          ) : (
            <div className="moss-no-comments">No comments yet. Start the conversation!</div>
          )}
        </div>
        <form onSubmit={handleSubmit} className="moss-comment-form">
          <textarea
            value={newComment}
            onChange={(e) => {
              setNewComment(e.target.value);
              e.target.style.height = 'auto';
              e.target.style.height = `${e.target.scrollHeight}px`;
            }}
            placeholder="Type your comment here..."
            className="moss-comment-input"
            style={{ overflow: 'hidden' }}
          />
          <div className="moss-comment-actions">
            <button type="button" className="moss-btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="moss-btn-primary" disabled={!newComment.trim()}>Post</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CommentBox;
