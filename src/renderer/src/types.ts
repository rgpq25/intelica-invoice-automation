export class ControlledError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "ControlledError";
	}
}


export type ResponseType<T> = {
	status: "Success" | "Error";
	message: string;
	result: T | null;
};

export type GeneralError = {
	title: string;
	description: string;
};
