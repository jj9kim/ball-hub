

interface PopupProps {
    trigger: boolean;
    children?: React.ReactNode;
}

function Popup({ trigger, children }: PopupProps) {
    return trigger ? (
        <div className="top-0 left-0 w-screen h-screen bg-[rgba(0,0,0,0.2)] flex justify-center items-center">
            <div className="relative p-8 w-full max-w-160 bg-white">
                <button className="absolute top-4 left-4">Close</button>
                {children}
            </div>
        </div>
    ) : null;
}

export default Popup;
