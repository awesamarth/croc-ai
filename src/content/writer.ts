// src/content/writer.ts

interface WriterOptions {
    mode: 'write_new' | 'rewrite';
    tone: 'casual' | 'formal' | 'professional';
    length: 'short' | 'medium' | 'long';
}

export async function generateText(text: string, options: WriterOptions): Promise<string> {
    try {
        if (options.mode === 'rewrite') {

            console.log("mode is rewrite");
            // Use Rewriter API
            //@ts-ignore
            const rewriter = await ai.rewriter.create();

            const result = await rewriter.rewrite(text);
            rewriter.destroy();
            return result;
        } else {
            // Use Writer API
            console.log('using the writer api')
            console.log(options.tone)
            //@ts-ignore
            const writer = await ai.writer.create({
                tone: options.tone === 'professional' ? 'formal' : options.tone,
                length: options.length,
                format: 'plain-text'
            });
            console.log(writer)
            const result = await writer.write(text);
            console.log(result)
            writer.destroy();
            return result;
        }
    } catch (error) {
        console.error('Error in generateText:', error);
        throw error;
    }
}

export function initializeWriter() {
    const style = document.createElement('style');
    style.textContent = `
    .croc-writer-popup {
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: #1a1a1a;
        padding: 16px;
        border-radius: 12px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
        z-index: 10000;
        width: 400px;
    }

    .croc-writer-tabs {
        display: flex;
        gap: 8px;
        margin-bottom: 16px;
    }

    .croc-writer-tab {
        padding: 8px 16px;
        background: #2d2d2d;
        color: #ffffff;
        border: none;
        border-radius: 6px;
        cursor: pointer;
    }

    .croc-writer-tab.active {
        background: #2563eb;
    }

    .croc-writer-textarea {
        width: 100%;
        min-height: 180px;
        padding: 12px;
        background: #2d2d2d;
        color: #ffffff;
        border: none;
        border-radius: 8px;
        margin-bottom: 16px;
        resize: vertical;
        box-sizing: border-box;
    }

    .croc-writer-options {
        display: flex;
        gap: 8px;
        margin-bottom: 16px;
    }

    .croc-writer-option {
        flex: 1;
        background: #2d2d2d;
        padding: 8px 12px;
        padding-right: 24px;
        border-radius: 6px;
        color: #ffffff;
        display: flex;
        gap: 8px;
        align-items: center;
        position: relative;
    }

    .croc-writer-option span {
        color: #ffffff;
        font-size: 14px;
    }

    .croc-writer-option select {
        flex: 1;
        background: transparent;
        border: none;
        color: #ffffff;
        outline: none;
        cursor: pointer;
        -webkit-appearance: none;
        appearance: none;
        width: 100%;
        padding: 0 16px 0 8px;
        font-size: 14px;
    }

    .croc-writer-option select option {
        background: #2d2d2d;
        color: #ffffff;
    }

    .croc-writer-submit {
        width: 100%;
        padding: 12px;
        background: #2563eb;
        color: #ffffff;
        border: none;
        border-radius: 6px;
        font-size: 14px;
        cursor: pointer;
        box-sizing: border-box;
    }

    .croc-writer-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.5);
        z-index: 9999;
    }

    .croc-writer-option::after {
        content: "";
        position: absolute;
        right: 12px;
        top: 50%;
        transform: translateY(-50%);
        width: 0;
        height: 0;
        border-left: 4px solid transparent;
        border-right: 4px solid transparent;
        border-top: 4px solid #ffffff;
        pointer-events: none;
    }`;

    document.head.appendChild(style);

    chrome.runtime.onMessage.addListener((message) => {
        if (message.type === 'showWriter') {
            const activeElement = document.activeElement;

            const isEditable = activeElement && (
                activeElement instanceof HTMLInputElement ||
                activeElement instanceof HTMLTextAreaElement ||
                activeElement.hasAttribute('contenteditable') ||
                activeElement.closest('.editable') ||
                activeElement.closest('[role="textbox"]') ||
                activeElement.closest('.ql-editor') ||
                activeElement.closest('.tox-edit-area')
            );

            // Remove this restrictive check
            if (isEditable) {  // <-- Changed this line
                showWriterPopup(activeElement as HTMLInputElement | HTMLTextAreaElement);
            }

            console.log('Writer triggered for element:', {
                element: activeElement,
                isEditable,
                tagName: activeElement?.tagName,
                className: activeElement?.className
            });
        }
    });
}

function showWriterPopup(inputElement: HTMLElement) {
    const existingPopup = document.querySelector('.croc-writer-popup');
    if (existingPopup) existingPopup.remove();
    const existingOverlay = document.querySelector('.croc-writer-overlay');
    if (existingOverlay) existingOverlay.remove();

    const overlay = document.createElement('div');
    overlay.className = 'croc-writer-overlay';

    const popup = document.createElement('div');
    popup.className = 'croc-writer-popup';

    // Create tabs
    const tabs = document.createElement('div');
    tabs.className = 'croc-writer-tabs';
    tabs.innerHTML = `
        <button class="croc-writer-tab active">Write New</button>
        <button class="croc-writer-tab">Rewrite Existing</button>
    `;

    // Add tab click handlers
    const tabButtons = tabs.querySelectorAll('.croc-writer-tab');
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            tabButtons.forEach(b => b.classList.remove('active'));
            button.classList.add('active');
        });
    });

    // Create textarea
    const textarea = document.createElement('textarea');
    textarea.className = 'croc-writer-textarea';
    const initialValue = inputElement instanceof HTMLInputElement || inputElement instanceof HTMLTextAreaElement
        ? inputElement.value
        : inputElement.textContent || '';
    textarea.value = initialValue;

    // Create options row
    const options = document.createElement('div');
    options.className = 'croc-writer-options';

    const toneOption = document.createElement('div');
    toneOption.className = 'croc-writer-option';
    toneOption.innerHTML = `
        <span>Tone</span>
        <select>
            <option value="casual">Casual</option>
            <option value="formal">Formal</option>
            <option value="professional">Professional</option>
        </select>
    `;

    const lengthOption = document.createElement('div');
    lengthOption.className = 'croc-writer-option';
    lengthOption.innerHTML = `
        <span>Length</span>
        <select>
            <option value="short">Short</option>
            <option value="medium">Medium</option>
            <option value="long">Long</option>
        </select>
    `;


    options.appendChild(toneOption);
    options.appendChild(lengthOption);

    // Create apply button
    const applyButton = document.createElement('button');
    applyButton.className = 'croc-writer-submit';
    applyButton.textContent = 'Apply';

    applyButton.onclick = async () => {
        try {
            applyButton.disabled = true;
            applyButton.textContent = 'Generating...';

            const activeTab = tabs.querySelector('.active') as HTMLElement;
            const toneSelect = toneOption.querySelector('select') as HTMLSelectElement;
            const lengthSelect = lengthOption.querySelector('select') as HTMLSelectElement;

            const options: WriterOptions = {
                mode: activeTab.textContent?.toLowerCase().includes('rewrite') ? 'rewrite' : 'write_new',
                tone: toneSelect.value as 'casual' | 'formal' | 'professional',
                length: lengthSelect.value as 'short' | 'medium' | 'long',
            };

            const text = textarea.value || 'Write something creative';
            const generated = await generateText(text, options);

            // Update the input element with generated text
            if (inputElement instanceof HTMLInputElement || inputElement instanceof HTMLTextAreaElement) {
                inputElement.value = generated;
                inputElement.dispatchEvent(new Event('input', { bubbles: true }));
                //@ts-ignore
            } else if (inputElement.hasAttribute('contenteditable') || inputElement.closest('[role="textbox"]')) {
                //@ts-ignore
                inputElement.textContent = generated;
                //@ts-ignore
                inputElement.dispatchEvent(new InputEvent('input', { bubbles: true }));
            }

            popup.remove();
            overlay.remove();

        } catch (error) {
            console.error('Writer error:', error);
            applyButton.textContent = 'Error - Try Again';
            applyButton.disabled = false;
        }
    };

    // Assemble popup
    popup.appendChild(tabs);
    popup.appendChild(textarea);
    popup.appendChild(options);
    popup.appendChild(applyButton);

    overlay.onclick = (e) => {
        if (e.target === overlay) {
            popup.remove();
            overlay.remove();
        }
    };

    document.body.appendChild(overlay);
    document.body.appendChild(popup);
}