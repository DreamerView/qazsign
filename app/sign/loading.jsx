const Loading = () => {
    return (
        <div className="container-xl py-5 d-flex align-items-center">
            <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
            </div>
        </div>
    );
};

export default Loading;