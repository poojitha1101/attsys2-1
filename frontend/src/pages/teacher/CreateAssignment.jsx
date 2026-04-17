import { useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import '../../styles/teacher/CreateAssignment.css';

const CreateAssignment = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();

    const prefill = location.state || {};

    const [form, setForm] = useState({
        title: '',
        description: '',
        subject: prefill.subject || '',
        section: prefill.section || '',
        semester: prefill.semester || '',
        dueDate: ''
    });

    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setForm((prev) => ({
            ...prev,
            [e.target.name]: e.target.value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!form.title || !form.description) return;

        setLoading(true);

        try {
            const API_BASE_URL = import.meta.env.VITE_PORT
                ? `${import.meta.env.VITE_URL}:${import.meta.env.VITE_PORT}`
                : import.meta.env.VITE_URL;

            const res = await fetch(`${API_BASE_URL}/api/assignments/create`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    teacherId: id,
                    ...form
                })
            });

            if (res.ok) {
                navigate(`/teacher/${id}`);
            } else {
                const err = await res.json();
                console.error('Failed to create assignment:', err);
            }
        } catch (err) {
            console.error('Error:', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="create-assignment">

            <div className="form-container">
                <h2 className="form-title">Create Assignment</h2>

                <form onSubmit={handleSubmit} className="assignment-form">

                    {/* MAIN INFO SECTION */}
                    <div className="form-section">
                        <input
                            name="title"
                            placeholder="Assignment Title"
                            value={form.title}
                            onChange={handleChange}
                            required
                            className="form-input"
                        />

                        <textarea
                            name="description"
                            placeholder="Assignment Description"
                            value={form.description}
                            onChange={handleChange}
                            required
                            className="form-textarea"
                        />
                    </div>

                    {/* META DATA SECTION */}
                    <div className="form-grid">
                        <input
                            name="subject"
                            placeholder="Subject"
                            value={form.subject}
                            onChange={handleChange}
                            required
                            className="form-input"
                        />

                        <input
                            name="section"
                            placeholder="Section"
                            value={form.section}
                            onChange={handleChange}
                            required
                            className="form-input"
                        />

                        <input
                            name="semester"
                            placeholder="Semester"
                            value={form.semester}
                            onChange={handleChange}
                            required
                            className="form-input"
                        />

                        <input
                            type="date"
                            name="dueDate"
                            value={form.dueDate}
                            onChange={handleChange}
                            required
                            className="form-input"
                        />
                    </div>

                    {/* ACTIONS */}
                    <div className="form-actions">
                        <button
                            type="submit"
                            disabled={loading}
                            className="submit-btn"
                        >
                            {loading ? 'Creating...' : 'Create Assignment'}
                        </button>

                        <button
                            type="button"
                            onClick={() => navigate(-1)}
                            disabled={loading}
                            className="cancel-btn"
                        >
                            Cancel
                        </button>
                    </div>

                </form>
            </div>

        </div>
    );
};

export default CreateAssignment;

