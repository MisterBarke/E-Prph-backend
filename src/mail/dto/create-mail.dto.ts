export type CreateMailDto<T> = {
  email: string;
  subject: string;
  title: string;
  companyName: string;
  companyContry: string;
  template: string;
  companySlogan?: string;
  isHeadingImage?: string;
  imageHeadLink?: string;
  imageHeadUrl?: string;
  imageHeadAlt?: string;
  companyLinkedInUrl?: string;
  companyGithubUrl?: string;
  companyTwitterUrl?: string;
  context?: T;
};

export type CredentialMailDTO = {
  username: string;
  companyName: string;
  password: string;
};
export type NotificationMailDTO = {
  username: string;
  folderName: string;
  folderNumber: string
};

export const mailTemplateDirectory = '../../mail/templates';
export const layoutFilDirename = 'layout/global.hbs';
