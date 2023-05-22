import Heading from './Heading';
import Hint from './Hint';
import React, {useEffect, useState} from 'react';

export interface RadioOption {
    value: string;
    label: string;
    hint?: React.ReactNode;
}

interface RadioProps {
    id: string;
    title?: string;
    options: RadioOption[];
    onSelect: (value: string) => void;
    error?:boolean;
    hint?: React.ReactNode;
    defaultSelectedOption?: string;
}

const Radio: React.FC<RadioProps> = ({id, title, options, onSelect, error, hint, defaultSelectedOption}) => {
    const [selectedOption, setSelectedOption] = useState(defaultSelectedOption);

    useEffect(() => {
        if (defaultSelectedOption) {
            setSelectedOption(defaultSelectedOption);
        }
    }, [defaultSelectedOption]);

    const handleOptionChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const selectedValue = event.target.value;
        setSelectedOption(selectedValue);
        onSelect(selectedValue);
    };

    return (
        <div className='flex flex-col gap-1'>
            {title && <Heading grey={true} level={6}>{title}</Heading>}
            {options.map(option => (
                <label key={option.value} className={`flex cursor-pointer items-start ${title && '-mb-1 mt-1'}`} htmlFor={option.value}>
                    <input 
                        checked={selectedOption === option.value}
                        className="relative float-left mt-[3px] h-4 w-4 appearance-none rounded-full border-2 border-solid border-grey-300 after:absolute after:z-[1] after:block after:h-3 after:w-3 after:rounded-full after:content-[''] checked:border-green checked:after:absolute checked:after:left-1/2 checked:after:top-1/2 checked:after:h-[0.625rem] checked:after:w-[0.625rem] checked:after:rounded-full checked:after:border-green checked:after:bg-green checked:after:content-[''] checked:after:[transform:translate(-50%,-50%)] hover:cursor-pointer focus:shadow-none focus:outline-none focus:ring-0 checked:focus:border-green dark:border-grey-600 dark:checked:border-green dark:checked:after:border-green dark:checked:after:bg-green dark:checked:focus:border-green"
                        id={option.value}
                        name={id}
                        type='radio'
                        value={option.value}
                        onChange={handleOptionChange}
                    />
                    <div className='ml-2 flex flex-col'>
                        <span className='inline-block text-md'>{option.label}</span>
                        {option.hint && <span className='mb-2 inline-block text-xs text-grey-700'>{option.hint}</span>}
                    </div>
                </label>
            ))}
            {hint && <Hint color={error ? 'red' : ''}>{hint}</Hint>}
        </div>
    );
};

export default Radio;