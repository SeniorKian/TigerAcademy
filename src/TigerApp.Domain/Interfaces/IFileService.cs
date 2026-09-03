namespace TigerApp.Domain.Interfaces;

public interface IFileService
{
    Task<string> UploadAsync(Stream fileStream, string fileName, string contentType, CancellationToken cancellationToken = default);
    Task DeleteAsync(string filePath, CancellationToken cancellationToken = default);
    bool IsValidImage(string fileName);
    bool IsValidVideo(string fileName);
}
