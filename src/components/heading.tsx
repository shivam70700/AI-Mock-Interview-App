import { cn } from "@/lib/utils";

interface HeadingProps {
    title: string,
    description?: string
    isSubHeading?: boolean
}

const Heading = ({ title, description, isSubHeading = false }: HeadingProps) => {
    return (
        <div>
            <h2
                className={cn(
                    "text-2xl md:text-3xl text-gray-800 font-semibold font-sans",
                    isSubHeading && "text-lg md:text-xl"
                )}
            >
                {title}
            </h2>
            {description && (
                <p className="text-sm text-muted-foreground">{description}</p>
            )}
        </div>
    )
}

export default Heading;
