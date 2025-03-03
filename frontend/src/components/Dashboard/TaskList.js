// client/src/components/Dashboard/TaskList.js
import React from 'react';
import TaskItem from './TaskItem';
import '../../styles/Dashboard.css';

const TaskList = ({ tasks, fetchTasks, openEditTaskModal, pages, page }) => {
  return (
    <div className="mt-3">
      {tasks.map((task) => (
        <TaskItem key={task._id} task={task} fetchTasks={fetchTasks} onEditTask={openEditTaskModal} />
      ))}
      <nav>
        <ul className="pagination justify-content-center">
          {[...Array(pages)].map((_, index) => (
            <li key={index} className={`page-item ${page === index + 1 ? 'active' : ''}`}>
              <button className="page-link" onClick={() => fetchTasks(index + 1)}>
                {index + 1}
              </button>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
};

export default TaskList;
